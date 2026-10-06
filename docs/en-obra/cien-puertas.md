# Cien Puertas · el camino de vuelta a casa

Modo de un jugador tipo *escape room* de celular: 100 puertas, cada una con un acertijo, repartidas en 10
capítulos con escenario propio. Quien no juega hace de narrador: si juega Él, narra Ella (y al revés). Aparece al
empezar cada puerta a contar la historia, acompaña en una esquina sin estorbar y al final felicita.

> ⚠️ Este documento tiene las soluciones. Si van a jugarlo, mejor no leer la tabla de puertas.

## Investigación: cómo son estos juegos

- **100 Doors** (y sus secuelas *Challenge*, *Seasons*, *Escape from School*…): una puerta por nivel, un cuarto
  en una sola pantalla, objetos que se tocan, se arrastran o se guardan en un inventario, y **acertijos que usan el
  celular**: pellizcar, deslizar, sacudir para que caiga una llave, inclinar para que ruede una piedra, voltear el
  celular para sacar una escalera. Las mecánicas se aprenden en las primeras puertas y luego se combinan.
- **Brain Test / Tricky Doors**: acertijos «de pensar distinto», con trampas amables (la respuesta está en el
  texto, en darle la vuelta al celular o en tocar donde nadie mira).
- Lo que funciona: niveles cortos (1–3 min), una idea por puerta, pista opcional cuando alguien se atasca, recompensa
  inmediata (la puerta abriéndose) y variedad constante de mecánicas. Los cuartos llenos de cosas (que se mueven, se
  caen y a veces esconden algo) hacen que buscar sea parte del juego.
- Lo que molesta: pistas que regañan, textos largos en medio del juego, sensores que no responden sin explicarlo.

Fuentes: [100 Doors Challenge (Google Play)](https://play.google.com/store/apps/details?id=com.protey.doors_challenge&hl=en_US),
[100 Doors Challenge (App Store)](https://apps.apple.com/us/app/100-doors-challenge/id1089890170),
[Guía de 100 Doors 2013 (Jay is Games)](https://jayisgames.com/review/100-doors-2013.php),
[Cómo se juega 100 Doors](http://www.100doorswalkthrough.com/how-to-play/),
[Brain Test: Tricky Puzzles](https://play.google.com/store/apps/details?id=com.unicostudio.braintest&hl=en),
[DeviceOrientationEvent (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent),
[DeviceMotionEvent (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent),
[Micrófono en Capacitor: RECORD_AUDIO + MODIFY_AUDIO_SETTINGS](https://github.com/unfoldingWord/tc-mobile/pull/334).

## La historia

Una noche, un nubarrón travieso, **el Olvido**, entró por la ventana y se llevó los recuerdos de la pareja. Los
escondió detrás de cien puertas, en los lugares donde nacieron: la casa, el jardín, la cafetería, la terminal, la
playa, el bosque, la feria, el castillo de los cuentos y las estrellas. Cada puerta que se abre devuelve un
recuerdo (una lucecita en forma de corazón). En la puerta 100 los recuerdos vuelven a casa y el hogar se ilumina.

- **Narrador**: el otro personaje, con su modelo 3D, sus caras (feliz, hablar, beso) y la ropa que tenga puesta
  en la casa. Habla en segunda persona, con cariño («mi amor», «mi vida»), en frases cortas.
- **Al empezar** cada puerta: 1–2 frases de historia, recuerdo o molestadera («Ese cangrejo me pellizcó el dedo en
  Cartagena. Todavía le tengo rabia»). **Nunca** explica cómo se resuelve: lo que el acertijo necesita saber está en el
  cuarto (un cuadrito con la contraseña de golpes, la envoltura del dulce favorito, un dibujo en la arena, el letrero
  del túnel…). Se pasa tocando y el narrador se corre a su esquina.
- **Durante** la puerta: solo ánimo, nunca pistas, y poco: tras varios intentos fallidos o un buen rato quieto
  («Tú puedes, yo te espero aquí»), máximo dos veces por puerta, en un globito que se va solo. Cuando algo sale
  bien, sonríe (sin texto); si algo se rompe, pone cara de susto (y la primera vez dice algo: «¡Ay, eso era de mi
  abuela!»).
- **Al terminar**: felicita y dice algo bonito («Contigo hasta las puertas más difíciles se abren»).
- **Las pistas se compran** (ver «Antojos» abajo): el narrador no da nada gratis.
- Se puede cambiar todo el texto en `src/puertas/historia.ts` (por ejemplo, poner recuerdos propios).

## Los recuerdos (de verdad)

Cada cinco puertas (la 5 y la 10 de cada capítulo) vuelve un recuerdo: veinte en total, en orden, desde la villa
de Transformice hasta la niña que sueñan tener. Aparece una tarjeta tipo polaroid y los dos lo cuentan en una
conversación (el narrador en su globo y quien juega abajo, con su nombre). A veces no se ponen de acuerdo en cómo
pasó, para que dé risa; los recuerdos difíciles se cuentan con cariño y sin chistes. Quedan en «Recuerdos» del
mapa para volver a leerlos (un recuerdo se tiene cuando su puerta ya se abrió).

| Puerta | Recuerdo | Lo que discuten (o lo que cuentan) |
|---|---|---|
| 5 | La villa de Transformice (15 de septiembre) | ¿Lo quería estafar o no? «Estás como necesitada, así que ten» |
| 10 | Matemáticas y filosofía | «La filosofía no sé. El filósofo, tal vez» |
| 15 | Te busqué por todos lados | Ella lo buscó por todo el juego… ¿él de verdad la estaba buscando? |
| 20 | El 25 de octubre | ¿Treinta días o cuarenta? (del 15 de septiembre al 25 de octubre) |
| 25 | Videollamadas de 24 horas (la pandemia) | ¿Casi completaron las 24 horas o las completaron? |
| 30 | Compañeros de estudio (2021, los dos en once) | Las tareas de artística contra «casi todas» las de ella; el ICFES: ¿estudiaban o él explicaba? |
| 35 | Psicología | Él la convenció: ¿insistente o persistente? Pasó con el examen del día de su cumpleaños |
| 40 | La primera vez que nos vimos | «Eras perfecta» — «¿Era?» |
| 45 | La meta de diciembre (directora de Yanbal) | «Esta vez te estafaron a ti» — «El karma de Transformice»; la meta justo antes de Cartagena |
| 50 | Cartagena | Ella en una banca de piedra del aeropuerto y él en un hotel cinco estrellas; la moto acuática y el castillo |
| 55 | Me enamoré de la vida | Los días grises y cómo él la motivaba (sin chistes) |
| 60 | Las luces de diciembre en Medellín (con Disney) | ¿Las luces o los ojos de ella? |
| 65 | De Sopetrán a Bucaramanga | ¿Ocho horas o nueve? Somos el complemento |
| 70 | Halloween elegante | «Me derrite» — «Dímelo otra vez» |
| 75 | Un cumpleaños de reina | El restaurante de súper lujo… y quién pagó |
| 80 | Un cuento de hadas | «Eres mis oraciones respondidas» — «¿Hasta lo de las tareas?» |
| 85 | El planetario del Parque Explora | ¿Quién miraba a quién? |
| 90 | Mi hogar eres tú | La ansiedad, la abuela, el viaje a Bucaramanga: «tú eres mi pilar» (sin chistes) |
| 95 | La propuesta | La picada, la pijama, los ojos cerrados: ¿aretes, una cadena… o el anillo? «¡Lloré lo justo!» |
| 100 | Para siempre | ¿Katherine o Lexy Katherine? Los labios, la sonrisa, la camita y el final de Disney |

**Voces grabadas (opcional):** cada línea de los recuerdos y del final tiene un código (`r005-01`, `final-ella-2`…).
Si en `juego/web/public/voces/` hay un audio con ese nombre (y `node scripts/voces.mjs` lo agregó a `lista.json`),
se oye mientras sale su globo; si no, la línea se lee escrita. El guion para grabar está en `docs/en-obra/guion-voces.md`.

Además, las felicitaciones y los ánimos usan frases propias de quien narra (Ella: «me robaste el corazón… y eso
que la estafadora era yo»; Él: «cada vez que sonríes me vuelvo a enamorar»), y el final de la puerta 100 cambia
según quién narra. Todo está en `src/puertas/historia.ts`.

## Capítulos y puertas

| Cap. | Puertas | Escenario | Puertas que se usan |
|---|---|---|---|
| 1 | 1–10 | **Nuestra casa** de noche (sala con sofá, lámpara, cuadros) | de madera con pomo |
| 2 | 11–20 | **El jardín** de día (flores, árbol, colmena) | reja de jardín en arco |
| 3 | 21–30 | **La cafetería** de la primera cita | de vidrio con campanita |
| 4 | 31–40 | **La terminal** de buses (el viaje entre Medellín y la otra ciudad) | automática corrediza |
| 5 | 41–50 | **La playa** (Cartagena) | cabaña de bambú que sube |
| 6 | 51–60 | **El bosque** de las luciérnagas (noche) | redonda en el tronco de un árbol |
| 7 | 61–70 | **La feria** | cortinas de carpa |
| 8 | 71–80 | **El castillo** de los cuentos | rastrillo de hierro que sube |
| 9 | 81–90 | **Entre las estrellas** (nave) | compuerta de iris |
| 10 | 91–100 | **Nuestro hogar para siempre** | puerta doble con forma de corazón |

Cada capítulo cambia escenario, luz, música y puerta; dentro del capítulo cambian los objetos y el acertijo.
Las primeras puertas de cada capítulo presentan una mecánica nueva y las últimas la combinan con las anteriores.

### Mecánicas de celular (con alternativa táctil)

Todas las que dependen de un sensor tienen una alternativa si el celular no lo tiene o no dio permiso (la pista
la explica), para que nadie se quede trabado.

| Mecánica | Cómo se detecta | Alternativa |
|---|---|---|
| Inclinar | `deviceorientation` / gravedad de `devicemotion`, girada según la orientación de la pantalla | arrastrar |
| Sacudir | aceleración brusca repetida | tocar el objeto muchas veces |
| Boca abajo | la gravedad apunta hacia la pantalla | mantener presionada la luna/el interruptor |
| Voltear 180° | cambio de `screen.orientation` (paisaje ↔ paisaje invertido) | tocar el letrero tres veces |
| Apagar y prender la pantalla | `visibilitychange` (oculta → visible) | tocar el interruptor |
| Quieto | poca aceleración durante unos segundos | no tocar la pantalla |
| Soplar | micrófono (volumen), con permiso | frotar |
| Silencio | micrófono bajo | no tocar la pantalla |
| Vibración | `navigator.vibrate` con un patrón (Morse) | la misma señal en luz |
| Hora del celular | reloj del teléfono | — (siempre existe) |
| Toques, toques rápidos, mantener, deslizar, arrastrar, frotar, dibujar, pellizcar, girar con dos dedos, dos dedos a la vez | eventos táctiles | — |

### Las 100 puertas

| # | Acertijo | Mecánica |
|---|---|---|
| 1 | Bajo el tapete ya no está la llave, sino una notica («ahora la guardo en un bolsillo»): tocar el abrigo del perchero, tomar la llave y usarla | arrastrar, inventario |
| 2 | Llamar como llamábamos: tres golpecitos y uno largo (anotado en un cuadrito de la sala; hay otro cuadrito que despista) | ritmo de toques |
| 3 | Prender las lámparas en el orden de colores del cuadro (hay una quinta lámpara, lila, que no va) | secuencia |
| 4 | La llave se perdió entre los cojines del sofá: levantarlos | deslizar |
| 5 | El timbre está pegado: tocarlo muchas veces seguidas (zumba cada vez más y al final suena ding-dong). Timbre grande con un área de toque generosa; cuenta al bajar el dedo (vale tamborilear con dos dedos): 12 toques y se descarga despacio | toques rápidos |
| 6 | Laberinto de canica en la pared: llevarla al hueco | inclinar |
| 7 | La foto de los dos rota en cuatro: armarla; atrás está el código | rompecabezas + candado |
| 8 | «Algunas cosas solo brillan en la oscuridad»: apagar la luz y leer las estrellas del techo | interruptor + código |
| 9 | El reloj de la sala («aquí siempre es ahora», dice el papelito): ponerlo en la hora del celular | girar, hora real |
| 10 | La llave cuelga de la lámpara del techo | sacudir |
| 11 | La semilla tiene sed: echarle agua con la regadera | inclinar para verter |
| 12 | Pintar las flores como las alas de la mariposa | colores |
| 13 | Topos: pegarles a ocho (más rápidos que antes) hasta que salga el de la llave | reflejos |
| 14 | Sacudir el árbol y contar manzanas rojas, verdes y amarillas | sacudir + contar |
| 15 | Soplar el diente de león: las semillas dejan ver el número | soplar |
| 16 | El caracol lleva la llave; si lo tocas se esconde | paciencia |
| 17 | Pisar las piedras del camino en el orden del dibujo | secuencia |
| 18 | El reloj de sol: mover el sol hasta que la sombra marque el corazón | arrastrar |
| 19 | Barrer las hojas para encontrar la trampilla y sus símbolos | frotar + símbolos |
| 20 | El invernadero empañado: limpiar el vidrio | frotar + código |
| 21 | Preparar el pedido del tablero en su orden | secuencia |
| 22 | Arte latte: dibujar un corazón en la espuma | dibujar |
| 23 | Equilibrar la balanza con terrones de azúcar | lógica |
| 24 | La rocola: repetir la canción (siete notas, con sonido de rocola) | memoria de sonidos |
| 25 | La cuenta con propina: el total (30) es la clave | sumar |
| 26 | El vidrio del café se empaña: soplar | soplar |
| 27 | Galletas de la fortuna: armar la palabra con sus letras | anagrama |
| 28 | Las tres tazas: seguir la que tiene la llave (nueve cambios, más rápidos) | seguimiento |
| 29 | El letrero giratorio: girarlo con dos dedos para leerlo | girar con dos dedos |
| 30 | El letrero dice CERRADO… al voltear el celular dice ABIERTO | voltear 180° |
| 31 | El mapa tiene un corazón en Cartagena: buscar su andén en el tablero de salidas | leer y deducir |
| 32 | La maleta de tres números: los sacan las calcomanías | contar + candado |
| 33 | Letras que giran en el tablero: pararlas en TE AMO («lo que siempre nos decimos», dice el letrerito) | tiempo justo |
| 34 | El torniquete: pasar el tiquete de un deslizón, ni lento ni rápido | deslizar con velocidad |
| 35 | Trazar la ruta en el mapa sin repetir carretera | camino |
| 36 | Tres relojes: poner el cuarto con la misma regla | lógica |
| 37 | El bus se mueve: sostener el celular quieto hasta que las pelotas caigan (se oyen los buses pasar) | quieto |
| 38 | La máquina de dulces: la envoltura del favorito dice B4; moneda, código y sacudirla cuando se traba | monedas + sacudir |
| 39 | La banda de maletas: tomar la que dice la etiqueta | observar |
| 40 | El túnel: cerrar los ojos (apagar la pantalla) y volver a abrirlos | pantalla |
| 41 | Ordenar las conchas de menor a mayor (así lo dibujaron en la arena) | ordenar |
| 42 | Alisar el castillo de arena | sacudir |
| 43 | La botella: inclinar para traerla; el mensaje está al revés | inclinar + espejo |
| 44 | El cangrejo tiene cosquillas | frotar rápido |
| 45 | La marea deja ver los símbolos un momento | memoria |
| 46 | Soplar el velero hasta el muelle | soplar |
| 47 | Los cocos: sacudir la palmera | sacudir |
| 48 | El faro parpadea (y el celular vibra) en Morse | vibración / luz |
| 49 | Estrellas de mar: apagar todas (cada una cambia a sus vecinas) | lógica |
| 50 | Bajar el sol: al atardecer aparece el número en las velas | arrastrar |
| 51 | Oscuridad: buscar con la linterna | arrastrar la luz |
| 52 | Las luciérnagas se prenden en orden: repetirlo | memoria |
| 53 | El búho ulula el código | contar sonidos |
| 54 | Poner el celular boca abajo: las luciérnagas se juntan | boca abajo |
| 55 | Hongos musicales: tocar la melodía tallada en el árbol | notas |
| 56 | Cruzar el tronco con la pelota en equilibrio | inclinar |
| 57 | La telaraña con rocío esconde letras | frotar |
| 58 | Ordenar las fases de la luna | ordenar |
| 59 | La puerta del árbol solo abre con los ojos cerrados cinco segundos | pantalla apagada |
| 60 | El árbol pregunta una adivinanza | tocar la respuesta |
| 61 | Tiro al blanco | tiempo justo |
| 62 | La rueda de la fortuna: alinear los colores | girar |
| 63 | Algodón de azúcar: dar vueltas con el dedo | dibujar círculos |
| 64 | La máquina de peluches | inclinar + tocar |
| 65 | El martillo de fuerza (cuenta al bajar el dedo, mazo con área de toque grande, meta 16 y se descarga despacio) | toques rápidos |
| 66 | Las cartas de la adivina: parejas | memoria |
| 67 | Reventar los globos en orden | orden |
| 68 | El carrusel: tocar el caballito de la llave cuando baje | tiempo justo |
| 69 | La casa de los espejos: el código está al revés | espejo |
| 70 | El tiquete tiene la clave en letra diminuta | pellizcar para ampliar |
| 71 | El puente levadizo: bajar las dos cadenas a la vez | dos dedos |
| 72 | El dragón dormido: sacar la llave despacito y sin ruido | arrastrar lento / silencio |
| 73 | Apagar las velas soplando: aparece lo escrito | soplar |
| 74 | Girar los espejos para llevar la luz a la gema | lógica |
| 75 | Vestir la armadura | arrastrar |
| 76 | El caballo de ajedrez | lógica |
| 77 | El escudo distinto | observar |
| 78 | La poción del color pedido | mezclar colores |
| 79 | El criptex: girar los anillos hasta BESO | girar |
| 80 | La torre: bajar la trenza | deslizar repetido |
| 81 | Unir las estrellas en forma de corazón | trazar |
| 82 | Gravedad cero: guiar la llave entre la basura espacial | inclinar |
| 83 | Ordenar los planetas | ordenar |
| 84 | Sintonizar la radio hasta oír el código | girar + oído |
| 85 | La nave vibra en Morse | vibración |
| 86 | «En el espacio no hay arriba»: voltear el celular | voltear 180° |
| 87 | Asteroides: disparar hasta abrir paso | toques rápidos |
| 88 | Llevar la energía girando los tubos | lógica |
| 89 | El cohete: mantener el botón exactamente tres segundos | mantener |
| 90 | El eclipse: poner la luna justo encima del sol | arrastrar |
| 91 | Ordenar las fotos de nuestra historia | ordenar (memoria de los capítulos) |
| 92 | Los recuerdos ganados forman el código | meta-acertijo |
| 93 | La carta cifrada y la rueda para leerla | girar |
| 94 | El jardín de la casa: agua y sol | inclinar + arrastrar |
| 95 | El piano de colores | notas |
| 96 | La torta del aniversario: ingredientes y velas | orden + soplar |
| 97 | La caja musical: darle cuerda parejo | dibujar círculos |
| 98 | «Cierra los ojos y pide un deseo» | pantalla apagada |
| 99 | Todo junto: inclinar, sacudir y tocar | combinado |
| 100 | La puerta del corazón: los dos pulgares juntos cinco segundos | dos dedos + mantener |

## Recompensas

- Primera vez que se abre una puerta: +1 moneda para la casa (pasa como el sueldo del súper). Terminar un
  capítulo: +10 (un cuarto de lo que era: la casa se gana despacio). Cada cinco puertas vuelve un recuerdo nuevo al
  álbum del mapa.
- Estrellas por puerta (1–3) según el tiempo; con la pistica del caramelo, máximo 2; con una pista más grande, 1.
  No bloquean nada.

## Antojos: las pistas se compran con dulces

El narrador no regala pistas. El botón rosado del caramelo (arriba a la derecha, siempre está; late después de un
minuto) abre sus **antojos**: se le compra un dulce con monedas de la casa y, según lo que cueste, suelta una pista
más chica o más grande. Nunca la respuesta: ni la clave, ni el orden exacto.

| Dulce | Precio | Pista |
|---|---|---|
| Un caramelo | 4 | 1: un empujoncito («Algo en este jardín tiene mucha sed») |
| Chocolates | 10 | 2: más clara (dónde mirar, qué se puede hacer) |
| Fresas con crema | 20 | 3: la grande (cómo se hace, sin dar la clave) |

- Cada puerta tiene sus tres pistas en `pistas` (`src/puertas/niveles/capNN.ts`). Lo que ya dijo se puede volver a
  leer en el mismo panel gratis; los dulces de pistas ya dadas (o más chicas) no se venden otra vez.
- El dulce vuela hasta el narrador, se lo come (pose de comer, mordiscos), guiña el ojo y dice la pista en su globo.
  Si no alcanza la plata, se cruza de brazos con puchero («¿Sin dulce? Así no se vale, mi amor»).
- **De dónde sale la plata** (`src/puertas/monedero.ts`, `saldo()` y `gastarMonedas(n)`): primero del sobre del
  sueldo (`nuestro-hogar-sueldo`, lo ganado en los minijuegos que todavía no llegó a la casa) y el resto de la casa
  compartida: si la casa es local se cobra con `SincroLocal`; si es en línea, con la misma sesión de la casa
  (`conexionPareja()` y `guardar_casa` con la versión leída, como la casa). Sin conexión solo alcanza el sobre.
  Si la casa llega a tener su propio ayudante para cobrar desde otras páginas, se cambia solo en ese archivo.

## El desorden: cuartos llenos de cosas

Cada puerta riega entre 9 y 12 cosas del escenario (`src/puertas/desorden.ts`): libros, jarrones, cojines y portarretratos
en la casa; materas, gnomos y regaderas en el jardín; tazas, platos y jarras en el café; maletas y conos en la terminal;
baldes, cocos y conchas en la playa; hongos, farolitos y tronquitos en el bosque; bolos y palomitas en la feria; copas,
barriles y cascos en el castillo; herramientas, robotitos y pantallitas en la nave. Algunas van colgadas en la pared y
otras encima de un cajón o un banquito.

- **Todo se mueve**: se toma con el dedo, se arrastra y se lanza (sale con la velocidad del dedo; lanzar hacia arriba
  también lo manda contra la pared del fondo). Hay gravedad, rebote (las pelotas rebotan más), roce con el piso y
  paredes; las cosas caen encima de los muebles del acertijo y de otras cosas. Un toque suelto las hace saltar.
- **Lo frágil se rompe**: jarrones, platos, tazas, vasos, botellas, materas, frascos, copas, bombillos, portarretratos y
  espejos se hacen pedazos (con sonido de vidrio) si se estrellan a más de 5 m/s contra el piso o una pared; los
  pedazos saltan y se desvanecen a los tres segundos.
- **Esconden cosas**: debajo de algunas hay una notica de amor, una cosita perdida (un arete, un botón…) o una **pista
  falsa** del capítulo (`FALSAS`: parecen claves —«Cajita: 3 · 9 · 2», «Andén 7 → Bogotá»— pero no abren nada).
- **Nunca tapan**: se acomodan con una rejilla de la pantalla donde se pinta la puerta con su marco, todo lo del
  acertijo (también lo que aparece después, como una llave que cae), la interfaz y donde se para el narrador. Si algo
  lanzado queda quieto delante de la puerta, se corre solo hacia un lado. El narrador, al caminar, empuja lo que
  tenga en los pies.
- **Celular**: cada cosa es una sola malla con colores por vértice (una llamada de dibujo) y geometría en caché; la
  física corre a pasos fijos solo para lo que está despierto y todo se duerme al quedarse quieto.
- Un nivel puede pedir menos cosas o ninguna con `desorden: { cuantas }` o `desorden: { nada: true }`.

## Sonidos

Todo sintetizado (`src/puertas/sonidos.ts`, sobre `nota` y `rumor` de `src/sonido.ts`): el ding-dong del timbre (y su
zumbido trabado), los golpes en la madera, el tic tac y el cucú del reloj, el interruptor, las lámparas, el agua de la
regadera, los topos, la rocola, los hongos cantores, el ronquido del dragón, el choque de la armadura, la bocina del
faro, las olas, el piano y la caja musical de verdad, y lo que se rompe. Cada escenario tiene un ambiente bajito
(pájaros en el jardín, tazas en el café, buses en la terminal, olas y gaviotas en la playa, grillos en el bosque),
menos en las puertas donde hay que oír y contar (el búho) o que ya tienen su propio sonido (los buses de la 37).

## Nada tapa la puerta

- La lámpara del techo de la casa cuelga a un lado (`LAMPARA` en `cuarto.ts`), los muebles de los acertijos están a
  los lados de la puerta, el narrador cuenta la historia desde un lado y celebra sin taparla, su globo se acomoda
  entre el borde de la pantalla y la puerta, el inventario va en columna a la derecha y los avisos abajo a la izquierda.
- Revisión automática: `window.__puertas.tapan()` pinta en una rejilla de la pantalla las hojas de la puerta y cuenta
  qué se les cruza desde la vista de siempre (objetos del cuarto y del acertijo, el desorden, el narrador contando, en
  la esquina y celebrando, y la interfaz con textos largos de prueba). `node scripts/_puertas_tapan.mjs 1 100` lo
  corre en 844×390, 740×360 y 1024×768 (con `?revisar=1`, sin dibujar). Lo que es parte de la puerta (las cadenas de
  la reja, el aro de luz de la compuerta, el brillo del corazón) se llama `marco…` y no cuenta.

## Técnica

- Página propia `puertas.html` + `src/puertas/`: escena 3D en primera persona con el mismo estilo de plastilina
  (luces suaves, `RoomEnvironment`), cuartos armados con piezas simples y modelos de la casa y la tienda.
- `sensores.ts` junta los sensores con su alternativa; en pruebas se simulan (teclas y `window.__puertas`).
- Cada puerta es un módulo con su montaje, su lógica, sus pistas y una **prueba** que la resuelve con toques y
  sensores simulados, para verificar que las 100 se pueden pasar.
- Progreso en el celular (`localStorage`); las monedas llegan a la casa compartida.
- Pruebas: `PUERTO=5174 node scripts/_puertas.mjs <carpeta> <desde> <hasta>` resuelve cada puerta con su prueba
  (`?sinhistoria=1&rapido=4`); `scripts/_puertas_fotos.mjs` saca fotos sin resolver. `window.__puertas` tiene además
  `tapan()`, `desorden()` (cuántas cosas hay y cuántas se rompieron), `lanzar(i, vx, vy, vz)` y `antojo()`.
