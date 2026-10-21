# Piscina de PvZ · procedencia de los datos (20 de octubre de 2026)

Este registro justifica los datos funcionales de `src/jardin/pvz/datos/piscina.ts`. No certifica todavía la
interfaz de la aventura. Claude mantiene la propiedad de los gráficos; no se incorporan imágenes, sonidos,
animaciones, textos de almanaque ni código del juego original.

Se toma como referencia la **primera vuelta de aventura de PvZ 1 para PC**. No se mezclan las oleadas de la
segunda vuelta ni las variantes de Nintendo DS y móvil. El plan aprobado conserva el orden de plantas,
costes y reglas de PvZ; la historia del proyecto es propia.

## Fuentes consultadas

- [Wiki técnica de PvZ 1, plantas](https://wiki.pvz1.com/doku.php?id=教程:植物图鉴): vidas, costes,
  recargas, daño y duraciones de acción.
- [Referencia técnica TimeSpace](https://www.pvz1.com/timespace/ts/index.html): contraste de reglas de PC.
- [Reconstrucción pública, revisión fija c4692036](https://github.com/Patoke/re-plants-vs-zombies/tree/c4692036c5e11d227c8fb7c593b734dac96da028/Lawn):
  `Challenge.cpp`, tablas `gZombieWaves` y `gZombieAllowedLevels`, selección de cinta;
  `Board.cpp`, `PickZombieWaves`, `PickZombieType`, `RowCanHaveZombieType` y `SpawnZombiesFromPool`;
  `Zombie.cpp`, `gZombieDefs`, inicialización y velocidades. Es una reconstrucción de referencia, no el
  ejecutable original. Solo se extraen hechos y números; la implementación TypeScript es propia.
- Wiki.gg: [niveles 3-1](https://plantsvszombies.wiki.gg/wiki/Level_3-1),
  [3-2](https://plantsvszombies.wiki.gg/wiki/Level_3-2), [3-3](https://plantsvszombies.wiki.gg/wiki/Level_3-3),
  [3-4](https://plantsvszombies.wiki.gg/wiki/Level_3-4), [3-5](https://plantsvszombies.wiki.gg/wiki/Level_3-5),
  [3-6](https://plantsvszombies.wiki.gg/wiki/Level_3-6), [3-7](https://plantsvszombies.wiki.gg/wiki/Level_3-7),
  [3-8](https://plantsvszombies.wiki.gg/wiki/Level_3-8), [3-9](https://plantsvszombies.wiki.gg/wiki/Level_3-9)
  y [3-10](https://plantsvszombies.wiki.gg/wiki/Level_3-10): especies, apariciones fijas y recompensas.
  Se consultó su API pública de revisiones en esta fecha.
- Wiki.gg: [Zombi buzo](https://plantsvszombies.wiki.gg/wiki/Snorkel_Zombie_(PvZ)),
  [Zomboni](https://plantsvszombies.wiki.gg/wiki/Zomboni),
  [equipo de trineo](https://plantsvszombies.wiki.gg/wiki/Zombie_Bobsled_Team),
  [jinete de delfín](https://plantsvszombies.wiki.gg/wiki/Dolphin_Rider_Zombie)
  y [Big Trouble Little Zombie](https://plantsvszombies.wiki.gg/wiki/Big_Trouble_Little_Zombie).

Las descargas de consulta son temporales y no se incluyen en el repositorio.

## Plantas

El ID es estable y no depende del nombre que presente la vista.

| ID | Nombre | Sol | Recarga (s) | Vida | Regla de referencia |
|---|---|---:|---:|---:|---|
| `nenufar` | Nenúfar | 25 | 7,5 | 300 | Base exclusiva de agua; sostiene una planta terrestre |
| `aplastaflor` | Apisonaflor | 50 | 30 | 300 | 1800 de daño al aterrizar, cerca del blanco |
| `tripitidora` | Tripitidora | 325 | 7,5 | 300 | Un guisante de 20 por cada uno de tres carriles, cada 1,425 s |
| `zampalga` | Zampalga | 25 | 30 | 300 | Exclusiva de agua; arrastra un zombi y desaparece |
| `jalapeno` | Jalapeño | 125 | 50 | 300 | 1800 a todo el carril tras 1 s; derrite el hielo |
| `pinchohierba` | Pinchohierba | 100 | 7,5 | 300 | 20 por contacto cada 1,01 s; no recibe mordidas; solo tierra |
| `plantorcha` | Plantorcha | 175 | 7,5 | 300 | Guisante normal → fuego de 40; un guisante frío primero se descongela |
| `nuez-alta` | Nuez cáscara-rabias | 125 | 30 | 8000 | Bloquea el salto de pértiga y delfín |

Apisonaflor usa 1,26 s hasta despegar y 1,82 s hasta impactar, alcance de activación 70 y radio de impacto 40
en las coordenadas de este motor. Zampalga empieza el arrastre a los 0,5 s y termina a 1 s. Pinchohierba
aplica su primer pulso a los 0,26 s. Los tiempos y puntos de impacto se representan en pasos de 1/60 s:
las cajas de colisión y los fotogramas de las animaciones de PC no se reproducen literalmente.

La tabla técnica proporciona los 1,26/1,82 s de Apisonaflor; los contadores de la reconstrucción por sí solos
no describen toda su animación y no se usan para sustituir esos tiempos por 1,65 s. La Plantorcha tiene además
daño secundario del guisante de fuego en los siguientes 100 píxeles del mismo carril: reparto de 40 entre
los blancos, truncado y limitado entre 1 y 13 por blanco. Un guisante frío se vuelve normal en una primera
Plantorcha y necesita otra posterior para convertirse en fuego; no se reconvierte dos veces en el mismo tronco.

## Zombis

La vida corporal incluye los 70 puntos que el zombi normal pierde durante la fase sin cabeza. Algunas páginas
expresan 200 como daño necesario para incapacitarlo; se conservan 270 de cuerpo, coherentes con los mundos
anteriores y con la inicialización técnica.

| ID | Cuerpo | Protección | Puntos de oleada | Peso | Primera elección aleatoria |
|---|---:|---|---:|---:|---:|
| `zombi-flotador` | 270 | — | 1 | 4000 | Variante de normal al entrar en agua |
| `caracono-flotador` | 270 | Cono, 370 | 2 | 4000 | Variante de caracono al entrar en agua |
| `caracubo-flotador` | 270 | Cubo metálico, 1100 | 4 | 3000 | Variante de caracubo al entrar en agua |
| `zombi-buzo` | 270 | — | 3 | 2000 | 10 |
| `zomboni` | 1350 | — | 7 | 2000 | 10 |
| `zombi-trineo` | 270 por integrante | Trineo compartido, 300 | 3 por equipo | 2000 | 10 |
| `zombi-delfin` | 500 | — | 3 | 1500 | 10 |

Los flotadores no duplican el peso de elección del normal, cono o cubo. El director elige primero una especie
terrestre y la transforma al asignarla a una fila de agua. Solo normal, cono y cubo usan esta transformación;
La bandera conserva su ID y puede entrar al agua desde la sexta oleada; los demás terrestres no nadan. En las primeras cinco oleadas no se asignan flotadores al agua. Buzo y delfín
son exclusivamente acuáticos. Zomboni y trineo son terrestres. El trineo requiere hielo para deslizarse.

Las velocidades del nuevo comportamiento usan los valores de desplazamiento técnico de PC convertidos a
segundos: buzo 67, delfín 90 y 30 tras perderlo, trineo 60, Zomboni de 25 hasta 10 al avanzar. Los flotadores
mantienen la velocidad del normal, 80/4,7, ya usada por este motor. El equipo tiene cuatro integrantes; los
300 del trineo se aplican al vehículo compartido, no a cada ocupante. Zomboni es inmune al frío y a la
mantequilla, pero no se marca como indigerible: la Planta carnívora puede devorarlo en PvZ 1.

## Diez niveles

Todos usan seis carriles, agua en filas 2 y 3 (índices desde cero), nueve columnas y 50 de sol inicial salvo las
cintas, que empiezan con cero. No se conceden limpiapiscinas de tienda al abrir el nivel.

| Nivel | Oleadas | Especies terrestres adicionales | Especies acuáticas adicionales | Premio |
|---|---:|---|---|---|
| 3-1 | 10 | Caracono | Flotadores | Apisonaflor |
| 3-2 | 20 | Caracono, caracubo, lector, deportista | Flotadores | Tripitidora |
| 3-3 | 20 | Caracono | Flotadores, buzo | Zampalga |
| 3-4 | 30 | Caracono, saltador, caracubo, lector | Flotadores, buzo | Llave de tienda |
| 3-5 | 20 | Caracono, deportista | Flotadores, buzo | Jalapeño |
| 3-6 | 20 | Caracono, Zomboni, trineo | Flotadores | Pinchohierba |
| 3-7 | 30 | Caracono, caracubo, Zomboni, trineo | Flotadores, buzo | Plantorcha |
| 3-8 | 20 | Caracono | Flotadores, delfín | Nuez cáscara-rabias |
| 3-9 | 30 | Caracono, saltador, caracubo, Zomboni, trineo | Flotadores, delfín | Nota 3 |
| 3-10 | 30 | Caracono, caracubo, Zomboni, trineo | Flotadores, buzo, delfín | Marseta, para el mundo 4 |

Los normales y la bandera se añaden en oleadas enormes: 4/7/8 normales en 10/20/30. La última también
incluye un ejemplar fijo de cada especie elegible principal. El equipo de trineo no recibe un ejemplar fijo.
La presentación fija de buzo en 3-3, Zomboni en 3-6 y delfín en 3-8 está en la oleada 11 y en la final 20;
la tabla técnica permite su elección aleatoria desde la 10. Saltador y deportista usan su mínimo técnico 5.

3-4 guarda `llave-tienda`, sin implementar aquí una tienda ni conceder compras. 3-10 guarda `marseta` como
premio futuro, sin habilitarla hasta que se registre su comportamiento en el mundo 4. No se añade como planta
utilizable prematuramente.

## Cintas y minizombis

- 3-5 (`minijuego:'minizombis'`): Nenúfar 25, Nuez 15, Lanzaguisantes 25 y Petacereza 35. Presupuesto de
  oleada ×4. Cuerpos, cascos y escudos se reducen a la cuarta parte truncada; no se inventa un multiplicador
  adicional de movimiento o mordida. Los intervalos específicos del minijuego y el terreno se describen en
  el registro funcional de la piscina.
- 3-10: Nenúfar 25, Apisonaflor 5, Tripitidora 25, Zampalga 5, Jalapeño 10, Pinchohierba 10, Plantorcha 10 y
  Nuez cáscara-rabias 10. Presupuesto ×3.
- **Nenúfar no tiene un límite de 18 sobres emitidos durante la partida.** La tabla resumida de wiki.gg
  presenta 18 como máximo, pero la referencia técnica atenúa su peso linealmente desde 25 hasta 1 según la
  suma de nenúfares vivos y sobres en cinta, entre 0 y 18. A partir de 18 el peso sigue siendo 1; puede
  reponerse un apoyo perdido. `atenuarCinta` registra esa regla sin reutilizar `maximosCinta`.

La emboscada final del agua es independiente de las oleadas de entrada y de las lápidas nocturnas. El
contrato, las reglas de terreno, los limpiadores y sus pruebas quedan en el registro de implementación,
no en estas tablas de especies.

## Límites de esta referencia

No se afirma paridad binaria con PvZ PC: este motor usa puntos y radios propios, pasos de 60 Hz, aleatoriedad
sembrada y un director parametrizado. Las diferencias de geometría y animación se documentan; no se
compensan inventando vidas, costes, daño, recursos o recompensas. Los hechos de una fuente pública tampoco
acreditan por sí solos que una regla haya quedado implementada o que una partida haya sido ganada.
