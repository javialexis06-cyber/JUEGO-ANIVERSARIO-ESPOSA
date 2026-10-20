# Mundo 2 de PvZ · datos y fuentes (19 de octubre de 2026)

Datos funcionales de `src/jardin/pvz/datos/noche.ts`. El objetivo es la primera vuelta de aventura de PvZ 1
para PC, con la progresión propia ya acordada. Este registro acredita la investigación de parámetros;
la implementación y las pruebas del motor se registran por separado. No incluye gráficos ni interfaz.

Se consultaron estadísticas públicas y reglas del juego. Las descripciones del catálogo son propias;
no se incorporaron imágenes, audio, textos de almanaque, código ni archivos del juego original.

## Plantas

Todas tienen 300 puntos de vida. Recargas de PvZ 1: rápida 7,5 s, lenta 30 s y muy lenta 50 s.
Las siete setas son nocturnas; Comepiedras funciona también de día. No se asignan efectos de abono nuevos
a las plantas nocturnas: los efectos de PvZ 2 necesitan su investigación e implementación separadas.

| ID | Sol | Recarga | Regla incorporada en los datos |
|---|---:|---:|---|
| `seta-desesporada` | 0 | 7,5 s | 20 de daño cada 1,425 s; alcance de 240 px; sin caducidad de PvZ 2 |
| `seta-solar` | 25 | 7,5 s | Primer sol a los 7 s; después cada 24,25 s; soles de 15 hasta crecer a los 120 s, luego de 25 |
| `humoseta` | 75 | 7,5 s | 20 de daño cada 1,425 s; alcance de 320 px y daño perforante |
| `comepiedras` | 75 | 7,5 s | Retira su lápida a los 4,5 s |
| `hipnoseta` | 75 | 30 s | Se consume cuando un zombi la muerde despierta; conserva la vida del zombi al cambiar de bando |
| `seta-miedica` | 25 | 7,5 s | 20 de daño cada 1,425 s; carril completo; radio de miedo de 120 px |
| `seta-congelada` | 75 | 50 s | Activación a 1 s; 20 de daño; congelación de 4–6 s, o 3–4 si ya estaba frío; frío total de 20 s desde el impacto |
| `petaseta` | 125 | 50 s | Activación a 1 s; 1800 de daño; radio de 250 px; cráter de 180 s |

La [tabla general de plantas](https://plantsvszombies.wiki.gg/wiki/Plants_%28PvZ%29) ofrece vida, daño,
cadencia y activación. Las fichas de [Seta solar](https://plantsvszombies.wiki.gg/wiki/Sun-shroom_%28PvZ%29),
[Seta desesporada](https://plantsvszombies.wiki.gg/wiki/Puff-shroom_%28PvZ%29),
[Humoseta](https://plantsvszombies.wiki.gg/wiki/Fume-shroom_%28PvZ%29),
[Comepiedras](https://plantsvszombies.wiki.gg/wiki/Grave_Buster_%28PvZ%29),
[Hipnoseta](https://plantsvszombies.wiki.gg/wiki/Hypno-shroom_%28PvZ%29) y
[Seta miedica](https://plantsvszombies.wiki.gg/wiki/Scaredy-shroom_%28PvZ%29) completan sus reglas.

Para los parámetros precisos de hielo, miedo y explosión se prioriza la
[tabla técnica de plantas de PC](https://wiki.pvz1.com/doku.php?id=教程:植物图鉴) y la
[referencia técnica de tiempos](https://www.pvz1.com/timespace/ts/index.html).
La ficha inglesa de [Seta congelada](https://plantsvszombies.wiki.gg/wiki/Ice-shroom_%28PvZ%29)
afirma 3,25 s de congelación y 16 s posteriores de frío; no se mezclan esas cifras con la referencia de PC.
La de [Petaseta](https://plantsvszombies.wiki.gg/wiki/Doom-shroom_%28PvZ%29) da un radio aproximado de
3,5 casillas: se utiliza el dato técnico de 250 px, sin convertir esa aproximación a 280 px.
La ficha de Comepiedras redondea a 5 s en la prosa, pero su tabla y la tabla general indican 4,5 s.
La ficha de Seta solar redondea la producción a 24 s; se utiliza la cadencia de 24,25 s de la tabla general.

## Zombis

La [tabla general de zombis](https://plantsvszombies.wiki.gg/wiki/Zombies_%28PvZ%29) expresa la velocidad
en segundos por casilla. Se convierte a píxeles por segundo dividiendo los 80 px de una casilla por ese valor.
Todos muerden a 100 de daño por segundo, con las reglas comunes de frío y pérdida de cabeza del motor.

| ID | Cuerpo | Protección | Segundos por casilla | Puntos / peso de aparición |
|---|---:|---|---|---|
| `zombi-periodico` | 270 | Escudo de 150 | 4,7; 1,8 enfadado | 2 / 1000 |
| `zombi-portero` | 270 | Escudo metálico de 1100 | 4,7 | 4 / 3500 |
| `zombi-futbolista` | 270 | Casco metálico de 1400 | 2,5, también sin casco | 7 / 2000 |
| `zombi-bailon` | 500 | Ninguna | 1,5 al entrar; 5,5 bailando | 5 / 1000 |
| `zombi-acompanante` | 270 | Ninguna | 5,5 | Convocado; no se añade a la selección aleatoria de niveles |

Protecciones y presupuestos se contrastaron en las fichas de
[Lector](https://plantsvszombies.wiki.gg/wiki/Newspaper_Zombie_%28PvZ%29),
[Portero](https://plantsvszombies.wiki.gg/wiki/Screen_Door_Zombie_%28PvZ%29),
[Deportista](https://plantsvszombies.wiki.gg/wiki/Football_Zombie),
[Bailón](https://plantsvszombies.wiki.gg/wiki/Dancing_Zombie) y
[Extra](https://plantsvszombies.wiki.gg/wiki/Backup_Dancer_%28PvZ%29).
El bailón convoca en cruz y repone las bajas. El grupo sincroniza su avance; los efectos sobre una unidad
no deben transferir automáticamente daño ni reducción de mordida a todas las demás.

## Niveles

Todas las filas están activas y no cae sol del cielo. Los niveles normales empiezan con 50 de sol.
Los zombis convocados no forman parte de los presupuestos aleatorios. Las composiciones de las oleadas
fijas proceden de las tablas de primera vuelta de cada nivel, no de la segunda vuelta.

| Nivel | Oleadas | Lápidas PC | Premio |
|---|---:|---:|---|
| [2-1](https://plantsvszombies.wiki.gg/wiki/Level_2-1) | 10 | 4 | Seta solar |
| [2-2](https://plantsvszombies.wiki.gg/wiki/Level_2-2) | 20 | 4 | Humoseta |
| [2-3](https://plantsvszombies.wiki.gg/wiki/Level_2-3) | 10 | 4 | Comepiedras |
| [2-4](https://plantsvszombies.wiki.gg/wiki/Level_2-4) | 20 | 7 | Almanaque |
| [2-5](https://plantsvszombies.wiki.gg/wiki/Level_2-5) | 8 especiales | 9 | Hipnoseta |
| [2-6](https://plantsvszombies.wiki.gg/wiki/Level_2-6) | 10 | 7 | Seta miedica |
| [2-7](https://plantsvszombies.wiki.gg/wiki/Level_2-7) | 20 | 11 | Seta congelada |
| [2-8](https://plantsvszombies.wiki.gg/wiki/Level_2-8) | 10 | 11 | Petaseta |
| [2-9](https://plantsvszombies.wiki.gg/wiki/Level_2-9) | 20 | 11 | `nota-2` |
| [2-10](https://plantsvszombies.wiki.gg/wiki/Level_2-10) | 20 | 13 | `nenufar`, reservado para el siguiente mundo |

Las lápidas se distribuyen sin repetir casilla, escogiendo filas al azar por columna. Columnas con índice cero:

- 2-1, 2-2 y 2-3: `{6:1,7:1,8:2}`.
- 2-4 y 2-6: `{5:1,6:1,7:2,8:3}`.
- 2-7, 2-8 y 2-9: `{4:1,5:2,6:2,7:3,8:3}`.
- 2-10: `{3:1,4:2,5:2,6:2,7:3,8:3}`.
- 2-5: nueve casillas aleatorias en las columnas 3–8, con director propio.

La inicialización de PC contrastada por el agente de terreno agrupa 2-7, 2-8 y 2-9 con once lápidas
([referencia técnica](https://github.com/Patoke/re-plants-vs-zombies/blob/main/Lawn/Board.cpp#L1148-L1181)).
La ficha inglesa de 2-8 y su [lista de lápidas](https://plantsvszombies.wiki.gg/wiki/Grave_%28PvZ%29)
indican siete; se sigue la referencia técnica de PC y se deja visible la discrepancia.

En los niveles normales cada lápida restante genera un zombi de emboscada al final, salvo si está siendo
consumida por Comepiedras. La referencia técnica de PC usada para el motor elige básico o caracono al 50 %; no caracubos.
El alzamiento se programa a los 2,1 s de la última oleada y tiene 1,5 s de emergencia.
Las lápidas impiden plantar; no se simulan como enemigos con vida que puedan destruir los guisantes.

### 2-5: martillo

Se empieza con cero sol, nueve lápidas y tres semillas disponibles: Patatapum, Comepiedras y Petacereza.
Todos los zombis aparecen en lápidas. Básicos, caraconos y caracubos reciben respectivamente uno, dos y tres
golpes de martillo. Pueden soltar 75 de sol. Las lápidas se reponen durante el nivel.
La [ficha del minijuego](https://plantsvszombies.wiki.gg/wiki/Whack_a_Zombie) explica estas reglas;
la primera vuelta usa Petacereza, mientras que ciertas versiones del minijuego separado usan Seta congelada.

La [tabla estática de duración](https://plantsvszombies.wiki.gg/wiki/Modify_Plants_vs._Zombies)
marca diez oleadas para 2-5, pero el director especial de PC las sustituye por ocho.
El agente de terreno contrastó esa excepción y su calendario de aparición
([referencia técnica](https://github.com/Patoke/re-plants-vs-zombies/blob/main/Lawn/Challenge.cpp#L2801-L2923)):
primera tanda a los 2 s, intervalos de 20 s y tanda final desde unos 145 s. El triunfo requiere limpiar
los enemigos pendientes; no consiste en sobrevivir un tiempo inventado.

### 2-10: cinta

Distribución de semillas: Seta desesporada 10 %, Humoseta 15 %, Comepiedras 20 %, Hipnoseta 10 %, Seta miedica
15 %, Seta congelada 15 % y Petaseta 15 %. Se emiten como máximo trece sobres de Comepiedras en toda la
partida, no trece simultáneos. Al agotar ese tipo se normalizan los pesos restantes.
El presupuesto de zombis de las cintas de cierre de mundo se multiplica por tres, igual que en 1-10;
se conserva el orden de descuento del director existente.

## Límites del catálogo

Los datos no crean automáticamente una interfaz jugable ni validan todas las estrategias. El director sigue
la implementación determinista propia del repositorio y no reproduce cuadro a cuadro el ejecutable original.
Los calendarios especiales, lápidas, estados y recompensas necesitan sus pruebas funcionales correspondientes.
El Nenúfar se guarda como premio aunque su mundo todavía no esté implementado. No se añaden ingresos de
monedas, compras o recompensas extra para compensar las diferencias del motor.
