# Versus de dos personas sobre Gardendless (28 de octubre de 2026)

Javier pidió terminar el Versus usando Gardendless, para **dos personas**: una siembra plantas y la otra manda
zombis. Se abre en `jardin.html?modo=versus` desde **Versus** en el menú del Jardín. El versus anterior de 36
territorios con el motor propio sigue en **Minijuegos → Versus clásico** (`modo=prototipo`), sin cambios.

## Cómo se juega

- **En este dispositivo:** las plantas juegan en el tablero nativo (mismos costes, recargas, soles y casillas de
  Gardendless). La barra de la derecha es de los zombis: se elige una carta y se toca la flecha del carril.
- **Crear sala / Unirse con código:** quien crea la sala lleva las plantas y corre el motor; quien se une lleva los
  zombis y ve un tablero dibujado a partir de las fotos del anfitrión (unas diez por segundo). El anfitrión valida
  cada zombi (cerebros, recarga, carril) antes de soltarlo. La pausa la puede pedir cualquiera; un corte pausa.
- Escenario: cualquiera de las doce zonas del mapa (carriles, agua y noche nativos). Hasta ocho semillas de las 32
  adaptadas. Los zombis con flotador solo entran al agua y los demás solo por tierra.
- **Ganan las plantas** si resisten hasta que el reloj llega a cero. **Ganan los zombis** si uno llega a la casa
  (la podadora nativa protege una vez por carril). No hay oleadas ni victoria automática del motor.

## Valores

Están en `src/jardin/motores/versus-reglas.ts` y se cambian sin tocar el motor. El 29 de octubre Javier dejó el
balance del versus a criterio de Claude; estos valores quedan como definitivos.

| | Valor |
|---|---|
| Duración | 5 minutos |
| Cerebros | 150 al empezar, +25 cada 4 s |
| Zombi / Caracono | 50 · 5 s / 75 · 7,5 s |
| Periódico / Pirata espadachín | 100 · 10 s / 100 · 15 s |
| Caracubo / Cabezaladrillo | 125 · 15 s / 150 · 20 s |
| Futbolista / Breakdancer | 175 · 25 s / 200 · 25 s |
| Flotador / con cono / con cubo | 50 · 5 s / 75 · 7,5 s / 125 · 15 s |

## Implementación

- `public/jardin/motores/pvz2/historia.js`: con `versus: true` el nivel no lleva `ZombiesDeadWinCon`, desactiva
  `judgeVictory` para ese nivel y no anuncia oleada grande. `soltarZombi` usa
  `Zombies.spawnZombieFromLaneByType` nativo; `estadoVersus` devuelve plantas, zombis (en casillas), podadoras y
  la posición en pantalla de cada carril para alinear las flechas. `frente.js` añade las órdenes `soltar-zombi` y
  `estado-versus`. Adaptadores en versión `historia5`; `motores.lock.json` actualizado.
- `src/jardin/conquista/versus-nativo.ts` y `.css`: menú, preparación, partida local, sala (mensajes `vs:*`).
- La historia no cambia: la misma prueba de los doce tableros nativos pasa igual (15 casos).

## Comprobaciones

`npm run probar:pvz:versus-nativo` (Vite y red): seis casos en Chromium con el motor real. Cerebros, recargas y
carriles en un dispositivo; victoria de las plantas por tiempo; victoria de los zombis al llegar a la casa; sala
entre dos pestañas (`salas=local`) con zombis enviados por el invitado, mismo tablero y cerebros en ambos, pausa
del invitado, resultado compartido y revancha. Los cerebros añadidos y el reloj adelantado son casos preparados:
no certifican el balance. No se probó una sala real entre dos dispositivos por internet.

## Límites

- La vista del invitado es un tablero dibujado (retratos propios, carriles y podadoras); no es la imagen de Cocos.
- Sin guardado a mitad de partida: salir termina el duelo.

## Versus por territorios (1 de noviembre de 2026)

Javier pidió que el Versus también se pudiera jugar **capturando zonas**, con el mismo motor de la historia, que se
eligiera cuántas zonas neutrales hay y que **las dos personas jueguen varias zonas a la vez**. Al preparar el duelo
se elige el modo **Un jardín** (el de arriba, sin cambios) o **Territorios**.

- **Mapa:** La casa (base de las plantas) a la izquierda, la guarida zombi (una fortaleza de Umbra) a la derecha y
  3, 5, 7 o 9 zonas neutrales entre ellas, cada una de un mundo distinto de la campaña (Egipto, piratas, oeste,
  hielo…), de 4 a 6 carriles, con su escenario, noche y lápidas nativos. Se dibuja sobre `mapa-pais.webp` con los
  territorios de bordes orgánicos de la historia y rutas entre zonas vecinas. Hay zonas con agua solo si las
  plantas llevan nenúfar.
- **Atacar:** se toca una zona en el mapa. Cada bando ataca solo zonas **vecinas** de las suyas. Una batalla es
  un duelo del versus en el tablero de esa zona: las plantas la ganan si resisten su reloj; los zombis, si uno
  entra a la casa (la podadora protege una vez por carril). Quien gana se queda la zona.
- **Varias a la vez:** hasta 3 ataques abiertos por bando y 6 batallas en total (4 en equipos modestos). Cada
  batalla corre en su propio tablero de Gardendless; los que no se miran siguen jugando y **recogen sus soles
  solos** (módulo nativo `AutoCollectProperties`).
- **Plantas:** siembran en el tablero grande y cambian de batalla con los botones de abajo a la izquierda (sobre la
  casa, donde no se siembra). Al ganar una zona su defensa queda guardada (plantas, vida, soles y podadoras) y
  vuelve si la atacan otra vez.
- **Zombis:** un solo banco de cerebros para todas las batallas. En un dispositivo, la barra de la derecha tiene un
  tablero objetivo dibujado donde se toca el carril; en una sala, el invitado ve en grande la batalla que elige.
- **Guarnición:** una zona zombi atacada por las plantas suelta zombis sola; la guarida, más seguido y más fuertes.
- **Victoria:** tomar la base rival gana al instante. Si se acaba el reloj de la partida (10, 15 o 20 minutos),
  gana quien tenga más zonas; con las mismas, empate.
- **Sala:** el anfitrión (plantas) corre todos los tableros y valida cada orden del invitado; manda el estado del
  mapa y unas siete fotos por segundo de las batallas abiertas. Un corte pausa la partida.

| Valor (versus por territorios) | Cifra |
|---|---|
| Reloj de batalla | 2:00; La casa 1:40 (ventaja de local); la guarida 2:30 |
| Descanso de una zona tras su batalla | 25 s |
| Cerebros | 200 al empezar; cada 4 s: 15 + 15 por batalla abierta + 10 por zona zombi (tope 2000) |
| Soles al abrir un tablero nuevo | 150 + 50 por zona de las plantas (tope 400); una zona defendida conserva los suyos |
| Guarnición | un zombi cada 10 s (zombi o caracono); en la guarida cada 6 s (hasta caracubo y periódico) |
| Zombis del mazo | los 11 del versus, con sus costes y recargas |

Código: reglas en `src/jardin/motores/versus-territorios.ts` (sin motor), partida en
`src/jardin/conquista/versus-territorios.ts`. El puente (`historia.js`) acepta para el versus soles iniciales de
50 a 1000, reutilizar un tablero terminado y guardar su defensa. Pruebas: `scripts/probar-versus-territorios-reglas.mjs`
(9 reglas) y `scripts/probar-versus-territorios.mjs` (11 recorridos en Gardendless real, en un dispositivo y en sala;
casos preparados, no balance). La carrera nativa del reproductor de música (`getPosition` sobre una pista ya
cambiada) se corrigió con un cambio mínimo en `pvz2/assets/main/index.js`, fijado de nuevo en `motores.lock.json`.

## Minijuego Fusión (1 de noviembre de 2026)

`jardin.html?modo=fusion`, desde **Minijuegos → Fusión**: el modo Fusión aparte del encargo del 17 de octubre.
Doce niveles, uno por mundo de la campaña, con las oleadas ya probadas de esas áreas (sin balance nuevo). Se elige
un mazo de 8 y se ven las recetas que permite (o las 117); sembrar una planta encima de otra de su receta forma la
fusión. El progreso va en `pvz-fusion-v1` (`amigo-pvz-fusion-v1` en la versión de amigos). Prueba:
`scripts/probar-fusion-nativa.mjs`.
