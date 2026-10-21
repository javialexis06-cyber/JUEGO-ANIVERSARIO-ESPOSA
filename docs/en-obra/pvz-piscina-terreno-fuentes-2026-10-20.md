# Piscina · reglas de terreno y minijuego contrastadas

Investigación del 20 de octubre de 2026 para el motor propio de `src/jardin/pvz/`.
Se usa la primera vuelta de aventura de PvZ 1 para PC como referencia. Este documento registra hechos
y contratos propuestos; por sí solo no acredita que estén implementados ni probados.
No incorpora código, textos de almanaque, gráficos ni archivos del juego original.

La fuente técnica complementaria es la reconstrucción pública de PC fijada en
[`c4692036`](https://github.com/Patoke/re-plants-vs-zombies/tree/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn).
Es una referencia de reconstrucción, no una prueba de equivalencia con cada ejecutable comercial.
Los contadores allí expresados en centésimas se convierten a segundos; el motor propio conserva sus 60 Hz,
coordenadas y cuerpos puntuales. No se afirma paridad de animaciones, colisiones o fotogramas.

## 3-5: zombis pequeños

- Primera vuelta: veinte oleadas, dos banderas. El minijuego independiente usa treinta, por lo que no debe
  sustituir la duración de la aventura.
- Escala visual de cada zombi: 0,5. Vida del cuerpo, casco, escudo y protección de vuelo: división entera
  entre cuatro. La vida máxima del individuo se fija después de la reducción; los umbrales de brazo/cabeza
  deben partir de esa vida reducida. Ejemplos: cuerpo básico de 270 pasa a 67, casco de cono de 370 a 92.
- La inicialización no multiplica el daño de mordida ni la velocidad de desplazamiento. La velocidad de
  animación compensa la escala, y el desplazamiento compensa esa animación; no se deduce el doble de
  velocidad por tener tamaño mitad.
- La ficha comunitaria de [3-5](https://plantsvszombies.wiki.gg/wiki/Level_3-5) afirma doble velocidad y
  menciona que parecen comer más deprisa. Se priorizan las reglas técnicas de PC descritas arriba;
  no se mezclan ambos criterios para crear un ajuste propio.
- Presupuesto de enemigos multiplicado por cuatro, después del descuento de los fijos básicos, como bolos.
- Intervalo posterior a una oleada: 7,5 s; se conserva la anticipación por pérdida de vida de la oleada.
- Cinta: Lanzaguisantes 25, Petacereza 35, Nuez 15 y Nenúfar 25 como pesos iniciales.
- La referencia técnica atenúa el peso de Nenúfar desde 25 hasta 1 al pasar de cero a dieciocho unidades
  vivas más sobres en cinta. No es un límite de dieciocho sobres emitidos en toda la partida: permite
  reponer plantas destruidas y sigue existiendo una probabilidad pequeña al completar la piscina.
  La tabla comunitaria simplifica este comportamiento como máximo dieciocho.
- La cinta usa 4 s con hasta cuatro sobres en espera; 4,25 s con cinco o seis; 5 s con siete u ocho;
  10 s con más de ocho. Esta presión se calcula al emitir un sobre.

Referencias técnicas: `ZombieInitialize`, `UpdateAnimSpeed`, `UpdateZombieWalking` y `EatPlant` en
`Zombie.cpp`; `PickZombieWaves` y `UpdateZombieSpawning` en `Board.cpp`; `UpdateConveyorBelt` en
`Challenge.cpp`. La [ficha del minijuego](https://plantsvszombies.wiki.gg/wiki/Big_Trouble_Little_Zombie)
sirve como contraste, sin trasladar sus tres banderas a 3-5.

## Emboscada de piscina

- Se programa únicamente al comenzar la última oleada, con retraso de 2,1 s.
- 3-1 y 3-2: dos enemigos. 3-3 a 3-10: tres enemigos.
- Se eligen casillas distintas en las dos filas acuáticas, índices 2 y 3, columnas de índice 5 a 8.
  La presencia de una planta no excluye una casilla; la emboscada no destruye sus plantas al aparecer.
- La elección considera básico, caracono y caracubo, con sus pesos de aparición y filtrando los tipos
  permitidos por el nivel. No son buzos ni delfines. Los básicos llevan la representación acuática al
  permanecer en el agua.
- La fase de emergencia acuática dura 0,5 s, frente a los 1,5 s de una lápida de tierra.
- El triunfo debe esperar tanto el temporizador de emboscada como los enemigos resultantes.

La referencia técnica asigna un presupuesto auxiliar de 3, 5 o 7 puntos, pero no utiliza ese valor para
restringir la elección siguiente: el número de enemigos sigue siendo dos o tres. No debe inventarse un
recorte de enemigos por ese contador.
Referencias: `SpawnZombieWave`, `SpawnZombiesFromPool`, `PickGraveRisingZombieType` en `Board.cpp`
y `RiseFromGrave` en `Zombie.cpp`.

## Apariciones y hielo

- Buzo y delfín solo aparecen en agua. Los tipos comunes básicos, bandera, cono y cubo pueden recorrer
  agua con flotador; los demás tipos terrestres no deben asignarse arbitrariamente a esos carriles.
- En las cinco primeras oleadas, los enemigos comunes no se asignan al agua. Buzos y delfines conservan
  su elegibilidad acuática; las introducciones y la composición propia del nivel siguen aplicándose.
- Una entrada de trineo representa un equipo de cuatro miembros.
- Solo se asigna un equipo a una fila de tierra con una pista de hielo vigente. Si no existe una pista
  suficientemente iniciada, la entrada de trineo se sustituye por cuatro zombis básicos, sin regalar puntos
  ni omitir el presupuesto ya consumido. La comprobación técnica requiere que el inicio del hielo haya
  pasado de la coordenada 700 del tablero original.
- El hielo de Zomboni dura treinta segundos desde la última renovación. Los equipos de trineo sobre
  hielo prolongan su vigencia al menos cinco segundos. El suelo helado bloquea siembras; Jalapeño
  elimina la pista de su fila. Las coordenadas exactas de borde deben adaptarse al contrato del motor.

Referencias: `RowCanHaveZombieType`, `CanAddBobSled`, `SpawnZombieWave`, `AddZombieInRow`, `IsIceAt`
en `Board.cpp`; `ZombieTypeCanGoInPool`, `UpdateZamboni` y las fases de trineo en `Zombie.cpp`.

## Defensa de las filas acuáticas

El [limpiapiscinas](https://plantsvszombies.wiki.gg/wiki/Pool_Cleaner) es una compra de tienda de 1000,
no un premio automático por finalizar 3-10. La inicialización técnica consulta esa compra:

- Sin compra: las filas de agua tienen un cortacésped común. Puede matar a los enemigos del borde,
  pero se hunde al entrar en el agua y no limpia toda la fila.
- Con compra: el limpiapiscinas puede atravesar toda la fila. La referencia PC lo mueve a 250 px/s,
  frente a aproximadamente 333 px/s del cortacésped común; el motor propio ya tiene una velocidad de
  cortacésped anterior que debe conservarse fuera del contrato acuático.

Un contrato de motor puede recibir explícitamente si existe el limpiapiscinas. No debe conceder la
compra ni monedas, ni suponer que alcanzar un nivel equivale a comprarlo. La implementación de tienda
y la conexión de sus identificadores al guardado se registrarán aparte cuando existan.
Referencias: `LawnMowerInitialize` y `Update` de `LawnMower.cpp`.
