# Jardín de los Desvelados · plan completo para aprobar (17 de octubre de 2026)

**Estado: propuesta. No se implementa nada hasta que Javier la apruebe o la corrija.**

## Lo que se pidió

Terminar el Jardín como un juego completo del estilo de Plants vs. Zombies 1 y 2: arreglar los gráficos y la
jugabilidad, tener todas las plantas con el nivel donde se ganan, y contar una historia propia. Aparte, crear un
modo de fusiones como el «PvZ chino», en su propia sección, con reglas y una historia que no se mezclen con el
modo principal. Primero se entrega el plan: plantas, combinaciones, niveles e historia.

## Lo que ya existe y el plan anterior

En el repositorio y sus ramas no hay ningún plan de ChatGPT ni avances de fusiones. El historial archivado dice
que ChatGPT dejó de usarse y que Claude hace todo. Lo único que existe es lo que está jugable hoy:

- 12 patios, 8 plantas y 5 zombis originales, con progreso `jardin-v1` / `amigo-jardin-v1`.
- El modo para dos personas («Plantas contra zombis · jugar dos») con salas por código y en una pantalla.

Este plan parte de eso. Las 8 plantas y los 5 zombis se conservan con sus mismos IDs dentro del nuevo catálogo.

## Nombres propios y mecánicas equivalentes

Todas las mecánicas tienen su equivalente a Plants vs. Zombies 1. Los nombres, el aspecto, los enemigos, los
escenarios, la historia, la música y los sonidos son propios, con estilo de peluche y sabor colombiano. El
repositorio es público y la versión de amigos se comparte, así que no se usan nombres, arte ni audio de
PopCap/EA. La columna «Equivale a» sirve solo para entender el plan; no aparece en el juego.

## Lo que se ve mal y se juega mal hoy (revisado en capturas de la compilación actual)

1. El campo es un tablero que flota sobre un color plano. No hay casa, calle, cielo ni horizonte.
2. Las figuras son pequeñas (escala 0,57) y están hechas solo con esferas. Los zombis casi no se distinguen.
3. No hay animaciones reales, solo un balanceo. Nadie camina, muerde, dispara ni cae.
4. Las semillas son esferas planas. Las luces son botones de HTML encima del 3D.
5. Los faroles guardianes son cajas.
6. Las tarjetas usan emojis:
   - el texto del costo y la recarga se corta («100 ☀ 3 s»);
   - la pala sale como un cuadro con letras, porque el emoji 🪏 no existe en muchos teléfonos;
   - el chile sale gris.
7. La cámara queda lejos y el campo usa más o menos el 60 % de la pantalla.
8. Las oleadas salen al azar cada 30 s. No hay barra de progreso, aviso de oleada grande ni vista previa.
9. No se escogen semillas antes del nivel. Desde el patio 4 están todas, así que no hay plantas por ganar.
10. Hay 8 columnas (el género usa 9). Se empieza con 225 de luz y el cielo da luz cada 7 s, también de noche.

## Arreglos de gráficos

- **Escenario completo por mundo, hecho en Blender:**
  - a la izquierda, la casa de peluche con puerta, ventanas encendidas y porche;
  - césped con franjas, cerca, calle a la derecha por donde llegan, árboles y faroles;
  - cielo con degradado, sol, luna y nubes.
  - Cada mundo agrega lo suyo:
    - noche con despertadores enterrados en el césped;
    - estanque con agua animada;
    - niebla por capas;
    - tejado inclinado con tejas y chimenea.
- **Cámara del género:** frontal en tres cuartos. El campo de 9 columnas ocupa todo el ancho en horizontal.
  El banco de semillas va arriba, con espacio para 10 tarjetas.
- **Figuras nuevas** con los ayudantes de arcilla (`blob`, `sweep`, `lathe`), esqueleto, ojos, mejillas y costuras.
  - Plantas: animaciones de reposo, ataque y daño.
  - Desvelados: animaciones de caminar, morder y caer dormidos (con «zzz»).
  - La armadura se ve y se cae cuando se rompe: la olla, el gorro, el paraguas.
  - Escala 1, siluetas que se reconocen de lejos.
- **Efectos:**
  - semillas con modelo y estela;
  - pelusa al impactar;
  - escarcha visible sobre los ralentizados;
  - fuego, estallidos y cráter;
  - luces que caen meciéndose y vuelan al contador al tocarlas;
  - faroles de la abuela que ruedan por el carril.
- **Interfaz:**
  - tarjetas con retrato 3D renderizado, sin emojis; costo legible y recarga como una cortina que baja;
  - barra de oleadas con banderines y carteles «¡Viene una oleada grande!» y «Última oleada»;
  - pantalla para elegir semillas, con la calle y los Desvelados que vienen;
  - mapa de mundos con caminos;
  - almanaque con el modelo girando;
  - globos de diálogo para los personajes.
- **Rendimiento:**
  - mallas instanciadas para el pasto y las semillas, y materiales compartidos;
  - sombras de disco y detalle según la distancia;
  - objetivo de 60 fps en un celular medio;
  - liberar WebGL al salir.
- **Sonido:** efectos sintetizados y música procedural por mundo. No hay voces nuevas (siguen descartadas) ni
  audio de PvZ. Los personajes hablan con texto.

## Arreglos de jugabilidad

- 9 columnas. 5 carriles, 6 en el estanque y la niebla. En el tejado se siembra solo en materas.
- Sembrar tocando o arrastrando la tarjeta. Pala siempre visible. Recoger luces tocando o pasando el dedo.
- Elegir semillas antes de cada noche. Las ranuras suben de 6 a 10 con la historia.
- Oleadas diseñadas a mano en cada noche:
  - puntos por oleada y una oleada grande cada 10;
  - la última oleada se anuncia;
  - vista previa de quién viene.
- Mecánicas de mapa:
  - despertadores enterrados (de noche salen Desvelados de ellos);
  - agua, niebla y tejado;
  - cinta de semillas en las noches grandes.
- Los hongos duermen de día y se despiertan con el Grano de tinto.
- Armaduras separadas y Desvelados especiales: saltan, flotan, vuelan, cavan, van en vehículo o se roban plantas.
- **Abono de luna** (como el abono de PvZ 2):
  - algunos Desvelados brillan y lo sueltan; se guardan hasta 3 cargas;
  - se le da a una planta para un poder grande según su familia:
    - productoras: +150 de luz;
    - tiradoras: ráfaga de 3 s;
    - barreras: coraza completa;
    - lanzadoras: tiro a todos los de la pantalla;
    - hongos: efecto doble;
    - explosivas: más área.
- **Estrellas por noche** (150 en total):
  - ★ ganar;
  - ★★ no gastar ningún farol;
  - ★★★ el reto propio de esa noche, por ejemplo no perder plantas, no sembrar en las 3 primeras columnas o
    gastar menos de cierta luz.
- Al caer, los Desvelados se quedan dormidos y se desvanecen soñando. Nada de sangre ni muerte.
- Un piloto de pruebas para cada noche y cada modo, como el que ya prueba los 12 patios.

## Los 51 tipos de planta

**Valores propuestos para aprobar.** Son de escala PvZ 1:

- luz inicial 50;
- el cielo da 25 de luz cada 10 s, solo de día;
- el frijol hace 20 de daño cada 1,4 s;
- recarga rápida (R) de 7,5 s, lenta (L) de 30 s y muy lenta (ML) de 50 s.

Estos valores son solo de la Historia. Los patios clásicos y el duelo conservan sus números actuales.

### Mundo 1 · El Patio de la Tarde (día)

| Se gana en | Planta (ID) | Qué hace | Equivale a | Luz | Recarga |
|---|---|---|---|---|---|
| Inicio | Frijol campana (`frijol`) ★ | Dispara una semilla por su carril. | Peashooter | 100 | R |
| 1-1 | Margarita farol (`margarita`) ★ | Suelta 25 de luz cada 24 s. | Sunflower | 50 | R |
| 1-2 | Chile cometa (`chile`) ★ | Estalla en 3×3 al sembrarlo. | Cherry Bomb | 150 | ML |
| 1-3 | Calabaza cojín (`calabaza`) ★ | Barrera muy resistente. | Wall-nut | 50 | L |
| 1-4 | Papa dormilona (`papa`) | Se entierra. A los 15 s despierta y estalla con el primero que la pisa. | Potato Mine | 25 | L |
| 1-6 | Menta escarcha (`menta`) ★ | Dispara semillas frías que ralentizan. | Snow Pea | 175 | R |
| 1-7 | Boca de dragón (`dragon`) | Se traga entero al de enfrente y mastica 42 s. | Chomper | 150 | R |
| 1-8 | Enredadera gemela (`gemela`) ★ | Dos semillas por disparo. | Repeater | 200 | R |
| 1-10 | Hongo pompón (`pompon`) | Gratis. Dispara corto, a 3 casillas. | Puff-shroom | 0 | R |

★ = planta que ya existe; conserva su ID.

### Mundo 2 · La Noche del Barrio (noche, despertadores enterrados, sin luz del cielo)

| Se gana en | Planta (ID) | Qué hace | Equivale a | Luz | Recarga |
|---|---|---|---|---|---|
| 2-1 | Hongo velita (`velita`) | Da 15 de luz. Al crecer da 25. | Sun-shroom | 25 | R |
| 2-2 | Hongo suspiro (`suspiro`) | Su vapor atraviesa todo en 4 casillas, también los escudos. | Fume-shroom | 75 | R |
| 2-3 | Musgo silencio (`musgo`) | Se come un despertador enterrado. | Grave Buster | 75 | R |
| 2-4 | Hongo arrullo (`arrullo`) | Quien lo muerde queda sonámbulo y camina hacia atrás peleando por ti. | Hypno-shroom | 75 | L |
| 2-6 | Hongo tímido (`timido`) | Dispara de lejos. Se esconde si un Desvelado se acerca. | Scaredy-shroom | 25 | R |
| 2-7 | Hongo sereno (`sereno`) | Congela a todos los Desvelados de la pantalla. | Ice-shroom | 75 | ML |
| 2-8 | Hongo trueno (`trueno`) | Gran explosión. Deja un hueco 3 minutos. | Doom-shroom | 125 | ML |
| 2-10 | Nenúfar balsa (`nenufar`) | Permite sembrar en el agua. | Lily Pad | 25 | R |

### Mundo 3 · El Estanque (día, 6 carriles con 2 de agua)

| Se gana en | Planta (ID) | Qué hace | Equivale a | Luz | Recarga |
|---|---|---|---|---|---|
| 3-1 | Ahuyama brava (`ahuyama`) | Salta y aplasta al Desvelado cercano. | Squash | 50 | L |
| 3-2 | Trébol campanero (`trebol`) | Dispara en su carril y en los dos vecinos. | Threepeater | 325 | R |
| 3-3 | Alga abrazadora (`alga`) | Hunde al primero que pasa por su casilla de agua. | Tangle Kelp | 25 | L |
| 3-4 | Ají pajarito (`aji`) | Quema el carril entero. | Jalapeño | 125 | ML |
| 3-6 | Cadillo (`cadillo`) | Pinchos en el suelo. Ponchan vehículos. | Spikeweed | 100 | R |
| 3-7 | Leño fogón (`leno`) | Las semillas que lo cruzan se vuelven fuego: doble daño y quitan la escarcha. | Torchwood | 175 | R |
| 3-8 | Calabaza torre (`calabaza_alta`) | Barrera alta. Nadie la salta. | Tall-nut | 125 | L |
| 3-10 | Hongo burbuja (`burbuja`) | Gratis, solo en el agua. Dispara corto. | Sea-shroom | 0 | L |

### Mundo 4 · La Niebla de Madrugada (noche, estanque y niebla)

| Se gana en | Planta (ID) | Qué hace | Equivale a | Luz | Recarga |
|---|---|---|---|---|---|
| 4-1 | Bombillo de monte (`bombillo`) | Despeja la niebla a su alrededor. | Plantern | 25 | L |
| 4-2 | Cardón (`cardon`) | Espinas que atraviesan y revientan globos. | Cactus | 125 | R |
| 4-3 | Diente de león soplón (`soplon`) | Sopla la niebla un rato y se lleva a los de globo. | Blover | 100 | R |
| 4-4 | Frijol de dos caras (`doscaras`) | Dispara adelante y dos veces atrás. | Split Pea | 125 | R |
| 4-6 | Carambolo (`carambolo`) | Cinco estrellitas en cinco direcciones. | Starfruit | 125 | R |
| 4-7 | Totumo coraza (`totumo`) | Se pone encima de otra planta y la protege. | Pumpkin | 125 | L |
| 4-8 | Hongo imantado (`iman`) | Le quita a un Desvelado la olla, la escalera o lo que sea de metal. | Magnet-shroom | 100 | R |
| 4-10 | Repollito lanzador (`repollo`) | Lanza repollos por encima de los escudos. | Cabbage-pult | 100 | R |

### Mundo 5 · El Tejado (día, techo inclinado, solo en materas)

| Se gana en | Planta (ID) | Qué hace | Equivale a | Luz | Recarga |
|---|---|---|---|---|---|
| 5-1 | Matera de barro (`matera`) | Permite sembrar en el tejado. | Flower Pot | 25 | R |
| 5-2 | Mazorca lanzadora (`mazorca`) | Lanza granos y a veces arequipe, que pega 4 s. | Kernel-pult | 100 | R |
| 5-3 | Grano de tinto (`tinto`) | Despierta a un hongo de día. | Coffee Bean | 75 | R |
| 5-4 | Cebolla llorona (`cebolla`) | Quien la muerde llora y se cambia de carril. | Garlic | 50 | R |
| 5-6 | Hoja de bijao (`bijao`) | Protege a sus vecinas de almohadazos y descolgados. | Umbrella Leaf | 100 | R |
| 5-7 | Caléndula (`calendula`) | Suelta pétalos, la moneda del Vivero. | Marigold | 50 | L |
| 5-8 | Patilla lanzadora (`patilla`) | Lanza patillas pesadas con daño en área. | Melon-pult | 300 | R |

### El Vivero de Tulia (se abre en 2-5; se compra con pétalos)

| Planta (ID) | Qué hace | Equivale a | Luz | Pétalos |
|---|---|---|---|---|
| Margarita doble (`margarita_doble`) | Va sobre una margarita. Da el doble de luz. | Twin Sunflower | 150 | 400 |
| Enredadera cuádruple (`cuadruple`) | Va sobre una gemela. Cuatro semillas por disparo. | Gatling Pea | 250 | 500 |
| Hongo tormenta (`tormenta`) | Va sobre un hongo suspiro. Vapor en círculo. | Gloom-shroom | 150 | 500 |
| Enea puntera (`enea`) | Va sobre un nenúfar. Espinas que buscan solas, a cualquier carril. | Cattail | 225 | 600 |
| Patilla helada (`patilla_helada`) | Va sobre una patilla. Área que congela. | Winter Melon | 200 | 700 |
| Imán dorado (`iman_dorado`) | Va sobre un hongo imantado. Recoge pétalos y luces. | Gold Magnet | 50 | 250 |
| Cadillo de piedra (`cadillo_piedra`) | Va sobre un cadillo. Más fuerte y resiste vehículos. | Spikerock | 125 | 450 |
| Mazorca cañonera (`canon`) | Va sobre dos mazorcas. Dispara a donde toques. | Cob Cannon | 500 | 900 |
| Semilla espejo (`espejo`) | Copia otra tarjeta de tu banco. | Imitater | Igual | 1.000 |
| Hongo linterna (`hongo`) ★ | Esporas en área. No duerme de día: tiene su linterna. | Original | 175 | 250 |
| Flor campanilla (`campanilla`) ★ | Repara a las plantas vecinas. | Original | 125 | 250 |

**Total: 40 plantas de la historia + 9 del Vivero equivalentes a PvZ 1 + 2 originales que ya existen = 51.** Son
todas las de PvZ 1. PvZ 2 tiene más de 150 plantas; de él se toman la estructura, el abono, los jefes y las estrellas.

**Pétalos (propuesta para aprobar):**

- Es una moneda que solo existe en el Jardín. No toca monedas, compras ni inventario de la casa.
- Se ganan:
  - 100 por ganar una noche la primera vez;
  - 25 por repetirla;
  - 5 por cada Desvelado que suelte un pétalo;
  - con la Caléndula.
- Con la historia completa se junta más o menos lo que cuesta todo el Vivero (5.800), sin repetir mucho.

## Los Desvelados (27 tipos + 4 jefes de mundo)

| Aparece | Desvelado (ID) | Qué hace | Equivale a | Vida (+ armadura) |
|---|---|---|---|---|
| 1-1 | Remendado (`remiendo`) ★ | Camina y muerde. | Zombie | 200 |
| 1-2 | Abanderado (`bandera`) | Anuncia la oleada grande. | Flag | 200 |
| 1-3 | De gorro de dormir (`gorro`) | Armadura ligera. | Conehead | 200 + 370 |
| 1-6 | Saltacercas con trapero (`trapero`) | Salta la primera planta. | Pole Vaulting | 340 |
| 1-8 | De olla (`olla`) ★ | Armadura pesada. | Buckethead | 200 + 1.100 |
| 2-1 | Lector de cuentos (`cuento`) | Si le rompen el libro, se enoja y corre. | Newspaper | 200 + 150 |
| 2-2 | Corredor en pijama (`corredor`) ★ | Rápido y con poca vida. | Original | 180 |
| 2-3 | Paraguas (`paraguas`) ★ | Escudo de frente. Lo de arriba y el vapor lo pasan. | Screen Door | 200 + 1.100 |
| 2-6 | Rugbista de cobija (`rugbista`) | Rápido y muy acorazado. | Football | 200 + 1.400 |
| 2-8 | Bailarín sonámbulo (`bailarin`) | Llama a cuatro coristas. | Dancing | 500 |
| 2-8 | Corista (`corista`) | Llega con el bailarín. | Backup Dancer | 200 |
| 3-1 | Del flotador (`flotador`) | Cruza por el agua. | Ducky Tube | 200 |
| 3-3 | Buzo de bañera (`buzo`) | Va sumergido. | Snorkel | 200 |
| 3-6 | Planchador (`planchador`) | Aplasta plantas con una plancha gigante y deja sábanas. | Zomboni | 1.350 |
| 3-7 | Colchoneta (`colchoneta`) | Cuatro bajan resbalando por las sábanas. | Bobsled Team | 200 × 4 |
| 3-8 | Jinete de manatí (`manati`) | Salta la primera planta del agua. | Dolphin Rider | 340 |
| 4-1 | Del joyero musical (`joyero`) | Cuando termina la canción, estalla en 3×3. | Jack-in-the-Box | 340 |
| 4-2 | Del globo (`globo`) | Vuela por encima. | Balloon | 200 + 20 |
| 4-4 | Del pijama de topo (`topo`) | Cava y ataca por la izquierda. | Digger | 200 + 100 |
| 4-6 | Del brincolín (`brincolin`) | Salta las plantas una por una. | Pogo | 340 |
| 4-8 | El Osote (`osote`) | Raro. Huye y suelta pétalos. Es la clave del final. | Yeti | 1.350 |
| 5-1 | Descolgado (`descolgado`) | Baja por un hilo y se lleva una planta. | Bungee | 450 |
| 5-3 | Del escalerín (`escalera`) | Pone una escalera sobre las barreras. | Ladder | 200 + 500 |
| 5-4 | Catapulta de almohadas (`catapulta`) | Les tira almohadazos a las plantas de atrás. | Catapult | 850 |
| 5-6 | Grandote (`grandote`) ★ | Aplasta plantas y lanza al chiquitín. | Gargantuar | 3.000 |
| 5-6 | Chiquitín (`chiquitin`) | Sale volando del grandote. | Imp | 200 |
| 5-10 | Profesor Desvelo (`profesor`) | Jefe final en el Despertador Gigante. | Dr. Zomboss | 40.000 |

**Jefes de mundo** (como en PvZ 2):

- **1-10, El Gran Bostezo:** un remendado gigante. Cada 20 s bosteza y duerme una columna de plantas durante 4 s.
- **2-10, La Reina de la Pijamada:** llama coristas y se cambia de carril bailando.
- **3-10, El Capitán Planchador:** una plancha enorme que recorre los carriles dejando sábanas para las
  colchonetas.
- **4-10, La Dama de la Niebla:** se esconde en la niebla y apaga bombillos. Solo se le ve con luz o soplo.
- **5-10, el Despertador Gigante del Profesor:** tres fases.
  1. Suelta Desvelados y descolgados.
  2. Lanza tazas de tinto hirviendo, que se enfrían con el Hongo sereno, y granizados, que se derriten con el
     Ají pajarito.
  3. Suena la alarma, que aturde a los hongos.

## Los 50 niveles de la Historia (5 mundos × 10 noches)

Cada mundo sigue el mismo orden:

- x-1 a x-4 y x-6 a x-8: noches normales; cada una da una planta.
- x-5: minijuego con premio especial.
- x-9: carta de los Desvelados y una noche difícil.
- x-10: noche grande con cinta de semillas y jefe del mundo.

El orden exacto está en las tablas de plantas y Desvelados. Además:

| Mundo | Minijuego (x-5) y su premio | Premio de x-9 |
|---|---|---|
| 1 · Patio de la Tarde | «Ruedan las calabazas» (bolos con calabazas) → la Pala | Abono de luna |
| 2 · Noche del Barrio | «¡A la cama!» (golpear a los que se asoman con una almohada) → el Vivero | Ranura 7 |
| 3 · Estanque | «Rompe-materas» (romper materas que esconden plantas o Desvelados) → Desafíos | Ranura 8 |
| 4 · Niebla de Madrugada | «Tres en fila» (juntar plantas iguales) → Noches sin fin | Ranura 9 |
| 5 · Tejado | «Llueven descolgados» → Ranura 10 | Invitación del Profesor |

- 1-1 es un solo carril con frijoles. 1-2 tiene 3 carriles y 1-3 ya usa los 5.
- En 5-1 las materas vienen puestas.

**Después de la historia:**

- **Desafíos:** los 5 minijuegos más 5 variantes.
- **Noches sin fin:** supervivencia con banderines.
- **Patios clásicos:** los 12 de hoy, con sus estrellas intactas.
- **El duelo para dos:** como está.

## La historia: «La noche que nadie durmió»

Es independiente del canon de Astra, como dice la mitología para los minijuegos. No nombra a la pareja, porque
también la juegan los amigos. Se cuenta con globos de texto, la cámara del propio juego y cinco cartas.

**Personajes:**

- **Tulia, la vecina jardinera.** Abuela de ruana y sombrero, con una carretilla llena de semillas. Hace de guía,
  habla con refranes y lleva el Vivero. Dice: «A los desvelados no se les pega, mijo: se les manda a la cama».
- **El Profesor Desvelo.** Vive en la casa de la loma, lleva años sin dormir y toma tinto sin parar. Inventó el
  **Despertador Eterno** para que nadie «perdiera el tiempo durmiendo».
- **Los Desvelados.** Los vecinos del barrio, con ojeras, pijama y cobija. Por culpa del despertador ya no
  pueden dormir y caminan sonámbulos buscando la cama más tibia del barrio: la de tu casa. No son malos, tienen
  sueño. Cuando una planta los vence, se quedan dormidos.

**Prólogo.** Atardece y suena por primera vez el Despertador Eterno desde la loma. Tulia llega con su carretilla
y te regala un Frijol campana: «Esta noche nadie duerme en el barrio… menos tú, si cuidas el jardín».

**Mundo 1 · El Patio de la Tarde.**

- Tulia te enseña a sembrar y a recoger luz.
- Llegan los primeros Desvelados, todavía torpes. En 1-9 dejan su primera carta:
  > «Querido vecino: tu jardín se ve muy bonito. Solo queremos echarnos un sueñito en tu cama. Prometemos no
  > roncar. Atentamente, los Desvelados».
- En 1-10 aparece **El Gran Bostezo**, tan cansado que contagia el sueño a las plantas. Tulia te regala los hongos
  para la noche.

**Mundo 2 · La Noche del Barrio.**

- Cae la noche. Bajo el césped suenan despertadores enterrados que traen más Desvelados.
- Tulia explica que los hongos trabajan de noche, y abre el Vivero.
- La carta de 2-9 propone una pijamada «con cobija incluida».
- La **Reina de la Pijamada** llega con su coro.

**Mundo 3 · El Estanque.**

- Los Desvelados intentan entrar por la piscina con flotadores, esnórquel y un manatí.
- En 3-10, el **Capitán Planchador** baja la loma planchando sábanas para resbalar hasta la casa.

**Mundo 4 · La Niebla de Madrugada.**

- La madrugada trae niebla y no se ve nada. Aparece varias veces **el Osote**, un oso de peluche gigante que no
  ataca y siempre huye.
- La carta de 4-9 está firmada distinto: «Esto no lo escribimos nosotros. El profe no nos deja dormir».
- La **Dama de la Niebla** apaga las luces del jardín.

**Mundo 5 · El Tejado.**

- Los Desvelados trepan al techo para entrar por la chimenea.
- En 5-9 llega la invitación formal del Profesor a rendirse.
- En 5-10, el Profesor aparece en la loma dentro del **Despertador Gigante**.

**Final.**

1. El Despertador Gigante se rompe y su campana se queda muda. El Hongo arrullo canta y, uno por uno, los
   Desvelados bostezan y se duermen en el jardín.
2. El Profesor confiesa que no duerme desde que perdió a su osito, porque soñaba que no lo encontraba.
3. Entonces llega el Osote: era su peluche, que lo buscaba por el barrio. Se acuesta a su lado.
4. Tulia los arropa con su ruana: «Buenas noches, barrio».
5. Créditos con cada Desvelado durmiendo y una línea suya.
6. Al amanecer, los vecinos despiertan descansados y el Profesor regala almohadas.
7. Se abren el Vivero completo y los modos de después de la historia.

## Injertos · El Vivero Revuelto (modo de fusiones, sección aparte)

Tiene su propia entrada en el menú, sus propias reglas, progreso (`jardin-injertos-v1` / `amigo-jardin-injertos-v1`),
Desvelados e historia. No aparecen Tulia ni el Profesor, y nada de aquí cambia la historia principal. **Propuesta:
se abre al ganar 1-10 de la Historia.**

**Historia propia:**

- En el valle de al lado hay un vivero viejo donde las raíces de todas las plantas se tocan bajo tierra.
- Una noche de tormenta cayó un rayo en el semillero. Las plantas despertaron sabiendo injertarse, y los
  Desvelados de ese valle despertaron cosidos unos con otros.
- **Mile, la injertadora**, aprende con su navaja de injertar a cruzar plantas para defender el vivero.
- La historia termina deshaciendo puntada a puntada a **La Quimera de Trapo**, un Desvelado gigante cosido con
  partes de todos.

**Reglas distintas a la Historia:**

- **Injertar:** se arrastra una tarjeta encima de una planta ya sembrada.
  - Si la pareja tiene receta, se paga la tarjeta y las dos se funden en un injerto que conserva el porcentaje de
    vida.
  - Si no hay receta, no germina y no se cobra.
- **Injertos mayores:** un injerto más una tercera planta concreta.
- **Libro de injertos:** guarda las recetas descubiertas. Las que faltan se ven como silueta con una pista.
- **Desvelados injertados** con rasgos mezclados. No hay abono de luna; la fuerza está en los injertos.
- **Plantas base:** cada capítulo da las suyas. No depende de lo ganado en la Historia.
- **4 capítulos × 8 niveles = 32 niveles.** Además:
  - **Laboratorio libre** para probar recetas;
  - **Noche sin fin de injertos**.

### Las 40 recetas (32 dobles + 8 mayores)

**Capítulo 1 · La tormenta en el semillero (día)**

| Receta | Injerto | Qué hace |
|---|---|---|
| Frijol + Margarita | Frijol solar | Dispara y suelta 15 de luz cada 3 disparos. |
| Frijol + Calabaza | Frijol trinchera | Barrera resistente que dispara. |
| Frijol + Chile | Frijol chispa | Semillas encendidas: doble daño y queman la casilla del impacto. |
| Frijol + Papa | Papa artillera | Lanza papitas que estallan donde caen. |
| Margarita + Calabaza | Margarita cojín | Da luz y aguanta como barrera. |
| Calabaza + Chile | Calabaza pólvora | Al romperse estalla en 3×3. |
| Menta + Gemela | Gemela escarcha | Doble semilla fría. Cada 4 impactos congela 1 s. |
| Boca de dragón + Calabaza | Calabaza mordelona | Barrera que muerde a quien la ataca. |
| **Frijol solar + Gemela** | **Gemela del alba** | Doble disparo y luz. |
| **Calabaza pólvora + Papa** | **Calabaza volcán** | Estalla en 3×3 y vuelve a crecer una vez como papa dormilona. |

**Capítulo 2 · Los hongos que no se dormían (noche)**

| Receta | Injerto | Qué hace |
|---|---|---|
| Margarita + Hongo velita | Margarita lunar | Da luz de día y de noche; de noche, el doble. |
| Frijol + Hongo suspiro | Frijol neblina | Su semilla atraviesa a todos los del carril. |
| Calabaza + Hongo arrullo | Calabaza de cuna | Quien la muerde se duerme y se cambia de bando (3 veces). |
| Chile + Hongo sereno | Chile granizado | Estalla en 3×3 y congela el resto de la pantalla 4 s. |
| Papa + Hongo trueno | Papa trueno | Mina enterrada que estalla en 5×5 sin dejar hueco. |
| Boca de dragón + Hongo tímido | Dragón tímido | Muerde de lejos con la lengua (3 casillas) y se esconde. |
| Gemela + Hongo pompón | Pompón gemelo | Gratis, doble disparo corto. Dura 60 s. |
| Menta + Hongo suspiro | Suspiro helado | Vapor que atraviesa y ralentiza. |
| **Margarita lunar + Hongo sereno** | **Luna de escarcha** | Da luz. Al morir congela la pantalla. |
| **Frijol neblina + Gemela escarcha** | **Gemela de niebla helada** | Doble semilla que atraviesa y ralentiza. |

**Capítulo 3 · El estanque revuelto (agua)**

| Receta | Injerto | Qué hace |
|---|---|---|
| Trébol + Margarita | Trébol solar | Dispara en 3 carriles y da luz. |
| Ají pajarito + Chile | Ají cometa | Quema su fila y su columna: una cruz. |
| Ahuyama + Calabaza torre | Ahuyama rebotona | Aplasta tres veces antes de irse. |
| Alga + Nenúfar | Nenúfar trampa | Hunde al primero que pasa y sigue sirviendo de base. |
| Leño fogón + Frijol | Leño tirador | Dispara fuego directo. |
| Cadillo + Calabaza | Calabaza erizo | Le devuelve el daño a quien la muerde. |
| Gemela + Hongo burbuja | Burbuja gemela | Gratis en el agua. Doble disparo corto. |
| Leño fogón + Menta | Leño de vapor | Las semillas que lo cruzan se vuelven vapor que daña dos carriles. |
| **Ají cometa + Hongo sereno** | **Ají de dos climas** | Quema la cruz y congela el resto. |
| **Trébol solar + Leño fogón** | **Trébol de fuego** | Tres carriles de semillas encendidas. |

**Capítulo 4 · La niebla y el tejado**

| Receta | Injerto | Qué hace |
|---|---|---|
| Bombillo + Margarita | Bombillo solar | Despeja la niebla y da luz. |
| Cardón + Diente de león | Soplo de espinas | Sopla los globos y lanza espinas a todos los carriles. |
| Carambolo + Frijol de dos caras | Carambolo de ocho puntas | Dispara en ocho direcciones. |
| Totumo + Calabaza | Totumo blindado | Coraza doble que también cuida a las vecinas (25 % menos daño). |
| Hongo imantado + Cadillo | Cadillo imantado | Quita el metal y pincha. |
| Repollito + Mazorca | Repollo con arequipe | Repollos, y cada 4 tiros, arequipe. |
| Patilla + Chile | Patilla volcán | Patillas en llamas que queman su casilla y la de atrás. |
| Cebolla + Hongo suspiro | Cebolla lacrimógena | Desvía y daña a todo el carril. |
| **Repollo con arequipe + Patilla** | **Patilla de arequipe** | Área grande y deja pegados a todos. |
| **Bombillo solar + Carambolo de ocho puntas** | **Estrella de madrugada** | Alumbra, da luz y dispara en ocho direcciones. |

### Desvelados injertados (8 + jefe)

| Mezcla | Desvelado injertado | Qué hace |
|---|---|---|
| Corredor + Olla | Corredor de olla | Rápido y acorazado. |
| Remendado + Globo | Remendado de globo | Vuela y cae a morder al llegar a una planta alta. |
| Grandote + Saltacercas | Grandote saltarín | Salta la primera planta. |
| Paraguas + Olla | Paraguas de olla | Escudo que devuelve 1 de cada 4 semillas. |
| Bailarín + Joyero | Bailarín de joyero | Cuando termina su baile, sus coristas estallan. |
| Topo + Descolgado | Topo ladrón | Sale detrás de las plantas y se lleva una. |
| Rugbista + Brincolín | Rugbista saltarín | Acorazado y salta las plantas. |
| Catapulta + Olla | Catapulta blindada | Acorazada; lanza ollas. |
| Jefe | La Quimera de Trapo | Cambia de partes en cada fase. |

## Figuras que hay que modelar en Blender

- 51 plantas: las 8 actuales se rehacen.
- 27 Desvelados y 4 jefes de mundo.
- El Profesor con el Despertador Gigante, Tulia y Mile.
- 32 injertos dobles y 8 mayores. Se arman por código con piezas de sus dos plantas y un detalle propio, para que
  se reconozca de dónde vienen.
- 8 Desvelados injertados y la Quimera.
- 5 escenarios de la Historia y 2 del modo Injertos (vivero de día y de noche).

## Guardado y compatibilidad

- No se toca nada de lo que ya existe:
  - `jardin-v1` / `amigo-jardin-v1` y sus estrellas siguen en **Patios clásicos**, con los mismos números;
  - solo cambian los gráficos del escenario.
- **Historia:** `jardin-historia-v1` / `amigo-jardin-historia-v1`.
- **Injertos:** `jardin-injertos-v1` / `amigo-jardin-injertos-v1`.
- **El duelo para dos** conserva sus 8 plantas, 5 zombis y reglas. Llevarle el nuevo catálogo sería otra
  propuesta de balance.
- **Versión de amigos:** tiene todo esto, porque no hay contenido de la pareja. Pasa el filtro de amigos.

## Entregas por fases (cada una probada, documentada y publicada)

1. **Base nueva:**
   - motor de la Historia aparte del clásico;
   - escenario del Patio de la Tarde, cámara, 9 columnas, banco de semillas y selector;
   - figuras rehechas de las 8 plantas y los 5 Desvelados actuales, con animaciones;
   - efectos, faroles y barra de oleadas;
   - los patios clásicos se ven con los gráficos nuevos y conservan sus números.
2. **Mundo 1 completo:** 10 noches, Tulia, mapa, almanaque, abono, estrellas, carta y El Gran Bostezo.
3. **Mundo 2:** noche, hongos, despertadores enterrados, Vivero y pétalos.
4. **Mundo 3:** estanque, agua, vehículos y Desafíos.
5. **Mundo 4:** niebla, globos, topo, el Osote y Noches sin fin.
6. **Mundo 5:** tejado, lanzadoras, jefe final, final y créditos, y Vivero completo.
7. **Injertos:**
   - 32 niveles, 40 recetas y libro de injertos;
   - 8 Desvelados injertados y La Quimera de Trapo;
   - Laboratorio libre y Noche sin fin de injertos.

Cada fase se comprueba así:

- el piloto gana todas las noches nuevas con varias semillas, y cada noche también se puede perder;
- recorridos de navegador por toque en las dos compilaciones;
- capturas revisadas y liberación de WebGL;
- la regresión de los patios clásicos y del duelo.

Esto no certifica la dificultad para personas ni teléfonos físicos.

## Decisiones que Javier debe aprobar o cambiar

1. **Nombres:** nombres y diseños propios con mecánicas equivalentes a PvZ 1, no los nombres ni el arte de PvZ.
2. **Tamaño:**
   - 51 plantas, 27 Desvelados y 4 jefes de mundo;
   - 50 noches de Historia;
   - Injertos con 40 recetas, 8 Desvelados injertados y 32 niveles.
3. **Valores de la Historia** en escala PvZ 1: luz inicial 50, cielo cada 10 s, costos, recargas y vidas de las
   tablas. Los patios clásicos y el duelo no cambian.
4. **Pétalos** como moneda solo del Jardín, con los precios del Vivero (5.800 en total) y lo que se gana por noche.
5. **Estrellas:** ★ ganar, ★★ sin gastar faroles, ★★★ reto de la noche. Abono de luna con máximo 3 cargas.
6. **Injertos** se abre al ganar 1-10 y tiene su propia progresión.
7. **El duelo para dos** queda igual por ahora.
8. **La historia y los personajes:** Tulia, el Profesor Desvelo, el Osote y Mile.
