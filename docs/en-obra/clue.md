# ¿Quién fue? · El misterio de la casona (Clue clásico en la mesa)

Pedido de Javier: «hacer un juego de mesa tipo Clue clásico: lee las normas de cómo se juega y crea el diseño de
tablero, armas, salas y demás conforme a nuestra forma de diseñar». Vive en la mesa (`mesa.html?juego=clue`) como
los demás juegos: contra la máquina, cada uno en su celular (en línea) y en sala con amigos (modo neutro).

## La historia (con humor, nada de sangre)

Don Cuervo, el dueño de la casona, apareció en el piso del sótano con **un chichón del tamaño de una arepa**. Está
bien (se queja mucho), pero alguien fue. Los jugadores son **los detectives** (los muñequitos de Javier y Laura, o de
cada amigo): recorren la casona, hacen sospechas y el primero que diga **quién, con qué y en qué cuarto** se gana el
caso. (A diferencia del Clue original, los jugadores no son sospechosos: nadie acusa a su pareja.)

## Las cartas: 6 sospechosos, 6 armas y 9 cuartos

| Sospechoso | Color | Quién es |
|---|---|---|
| Señorita Fresa | rojo | actriz de telenovela, llora cuando la miran |
| Coronel Maracuyá | amarillo | militar retirado, bigote enorme, cuenta la misma historia de la guerra |
| Doña Arepa | blanco | la cocinera de la casona, sabe todos los chismes |
| Don Aguacate | verde | el jardinero, siempre con tierra en las uñas |
| Señora Arándano | azul | la diva rica, abanico y perlas |
| Profe Mora | morado | profesor de química con bata y gafotas |

| Arma | Por qué |
|---|---|
| La chancla | el arma más temida de Colombia |
| El rodillo | el de amasar las arepas |
| La olla exprés | pita antes del golpe |
| El control de la tele | nadie lo suelta |
| La escoba | también sirve para barrer |
| La matera | se cayó «sola» del balcón |

Los **9 cuartos** de la casona (el sótano del centro no es cuarto: ahí está el sobre con la solución):

```
 ┌─────────┐   ┌──────────────┐   ┌─────────┐
 │ COCINA  │   │ SALÓN DE     │   │  PATIO  │ ← pasadizo con la Sala de TV
 │  ↘pasa- │   │ FIESTAS      │   │ DE LAS  │
 └─────────┘   └──────────────┘   │  MATAS  │
 ┌─────────┐   ┌──────────────┐   ├─────────┤
 │ COMEDOR │   │   SÓTANO     │   │ CUARTO  │
 │         │   │ (el sobre)   │   │ DE      │
 └─────────┘   └──────────────┘   │ JUEGOS  │
 ┌─────────┐   ┌──────────────┐   ├─────────┤
 │ SALA    │   │  RECIBIDOR   │   │BIBLIO-  │
 │ DE TV   │   │              │   │TECA     │
 └─────────┘   └──────────────┘   ├─────────┤
                                  │ ESTUDIO │ ← pasadizo con la Cocina
                                  └─────────┘
```

Pasadizos secretos entre esquinas opuestas, como en el original: **Cocina ↔ Estudio** y **Patio ↔ Sala de TV**.

## La referencia de Javier

Javier mandó la foto del Clue de 2023 (tablero en diamante): nueve cuartos vistos desde arriba, cada uno con su piso
(parquet, baldosa a cuadros, alfombra) y sus muebles (piano, mesa de billar, la mesa larga del comedor, sofás), pasillos
de baldosa a cuadros, la escalera en el centro, fichas de colores para los sospechosos, armas doradas y **dos dados**.
«1 sospechoso por sala, 1 arma por sala»: al empezar, cada sospechoso y cada arma quedan en cuartos distintos.

## Reglas (las del Clue clásico, en su variante oficial para dos)

- Al empezar, cada sospechoso y cada arma quedan en un cuarto distinto (uno por cuarto).
- Se arma el **sobre** con 1 sospechoso, 1 arma y 1 cuarto al azar. De las 18 cartas que quedan, **4 se ponen boca
  abajo en los 4 cuartos de las esquinas** (variante oficial de dos jugadores) y las otras 14 se reparten: 7 y 7.
- En su turno, cada uno: **tira los dos dados** y camina hasta esa cantidad de casillas por los pasillos (adelante o de lado,
  nunca en diagonal, sin pasar por encima del otro); o **toma el pasadizo secreto** si está en una esquina; o, si el
  otro lo trajo a este cuarto con una sospecha, **se puede quedar y sospechar ahí**.
- A los cuartos se entra **solo por las puertas** y entrar termina el movimiento (no hay que sacar el número exacto).
  No se puede volver a sospechar en el mismo cuarto en el turno siguiente sin salir (salvo que lo hayan traído).
- **Carta boca abajo**: al entrar a un cuarto de esquina que tenga una, la mira en secreto (le queda anotada).
- **Sospecha**: en el cuarto donde está, nombra un sospechoso y un arma; los dos se mudan a ese cuarto. El otro
  jugador, si tiene alguna de esas tres cartas, **le muestra una (escoge cuál) en secreto**. Si no tiene ninguna,
  nadie lo desmiente.
- **Acusación**: una sola, en su turno, desde donde esté. Se mira el sobre: si acierta, gana; si se equivoca, pierde
  (con dos jugadores, el otro gana el caso).

## Cómo se ve y se juega (celular en horizontal)

- **Tablero renderizado** en Blender visto desde arriba: cada cuarto lleno de muebles de fieltro (la cocina con su
  estufa y las ollas, el salón con la bola de discoteca, el patio con matas y la manguera…), pasillos de baldosa y el
  sótano con la escalera y el sobre. Encima, en SVG, las casillas que se pueden pisar, las puertas y las fichas.
- **Fichas**: los detectives son los muñequitos de cada uno (o del amigo); los sospechosos, figuritas de fieltro de
  su color; las armas, objetos de fieltro chiquitos que se mudan de cuarto con cada sospecha.
- Al tirar, se marcan las casillas y los cuartos a donde se puede llegar: se toca un cuarto (blanco grande) o una
  casilla, y la ficha camina casilla por casilla.
- **Sospechar**: una hoja con las caras de los sospechosos y las armas en tarjetas grandes. El sospechoso y el arma
  vuelan al cuarto. El otro escoge en su celular qué carta mostrar; al que preguntó le aparece la carta volteándose.
- **Cuaderno del detective** (botón 📒): las 21 cartas con lo que se sabe, que se llena solo (mis cartas, las que me
  mostraron, las que vi boca abajo) y con marcas a mano (✓ ✗ ?) para las deducciones propias.
- Los muñequitos reaccionan como en los demás juegos: sospechan con lupa, se sorprenden cuando les muestran una
  carta, presumen al acertar y hacen berrinche si se equivocan.
- Modos: contra la máquina y en línea (cada uno en su celular). **No hay «los dos aquí»**: las cartas son secretas.

## La máquina (IA)

Lleva un cuaderno de verdad: qué cartas tiene cada uno, cuáles no puede tener (porque no desmintió) y cuáles están
boca abajo. Camina hacia los cuartos que le sirven, sospecha de lo que no sabe y acusa cuando solo le queda un
sospechoso, un arma y un cuarto posibles. Fácil: sospecha medio al azar y tarda en deducir. Normal: deduce lo directo.
Difícil: también saca lo que implica que el otro no pueda desmentir.

## Técnica

- `src/mesa/clue/`: `reglas.ts` (estado JSON, movimientos puros; el reparto viaja en la primera jugada, tirado por
  quien empieza), `tablero.ts` (la casona en casillas), `ia.ts`, `vista.ts`, `clue.css`.
- El turno de mostrar carta es del que desmiente (`turno(e)` = quien muestra): así la mesa, la IA y el en línea no
  cambian.
- Modelos y render: `personajes/blender/clue.py` → `public/modelos/clue/` (tablero renderizado, sospechosos, armas e
  íconos de las cartas).
- Pruebas: `scripts/probar-clue.mjs` (reglas, IA contra IA muchas partidas, la vista y en línea).
