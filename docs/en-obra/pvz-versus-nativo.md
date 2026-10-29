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
