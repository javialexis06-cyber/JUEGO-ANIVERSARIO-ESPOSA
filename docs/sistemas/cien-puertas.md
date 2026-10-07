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
- **Los papelitos se dejan leer siempre**: son una notica doblada como carpita (la cara de adelante mira a la cámara,
  así se ve aunque el piso quede de lado), con sombrita y un aro de luz que late; se ponen encima de lo que haya en
  el piso (un tapete o una alfombra del acertijo: antes podían quedar debajo), tienen un área de toque generosa y
  **prioridad de toque** (aunque algo les quede encima, el toque les llega), y al aparecer quedan protegidos: nada se
  queda quieto encima. La nota que sale es grande, de papel de cuaderno (la pista falsa en un pos-it arrugado), con
  cinta, firma de quien la escribió y se despliega; un segundo toque seguido ya no la cierra por error (antes un
  doble toque la abría y la cerraba al tiempo). Por qué fallaban: quedaban debajo del tapete o de la cosa que las
  tapaba, la cosa que se corría se robaba el toque, eran planas y casi no se veían desde la cámara, y el doble toque.
- **Nunca tapan**: se acomodan con una rejilla de la pantalla donde se pinta la puerta con su marco, todo lo del
  acertijo (también lo que aparece después, como una llave que cae), la interfaz y donde se para el narrador. Si algo
  lanzado queda quieto tapando la puerta o algo importante (ver «Nada tapa lo importante»), o medio fuera de la
  pantalla (cerca de la cámara el cuarto es más ancho que lo que se ve), salta solito al sitio libre más cercano: uno
  al que el saltico llegue sin chocar (se sigue la misma parábola del salto contra los muebles y las otras cosas: si
  no, rebotaba en el marco de la puerta o en el borde de la mesa y volvía a caer donde estaba); si cerca no hay, busca
  en todo el cuarto; si tampoco, da un salto alto por encima de las cosas chiquitas; y si nada, vuelve a donde estaba
  al principio (si ahí quedó a la vista lo que escondía, el papelito se asoma solo). Hasta 6 intentos. El narrador,
  al caminar, empuja lo que tenga en los pies.
- **Los papelitos se asoman**: si algo les queda encima o delante, o quedaron detrás del narrador en su esquina (se
  mide con rayos a puntos de todo el papelito), se corren hacia adelante, a los lados o hacia atrás, a un sitio de la
  pantalla que no esté debajo de un mueble, hasta que se vean.
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

## Nada tapa lo importante

**Zonas protegidas** (`src/puertas/protegidas.ts`). Cada puerta tiene cosas que nunca pueden quedar tapadas, y se
deducen solas: la puerta, todo lo que se toca, se arrastra o se mantiene, los letreros, cuadros y notas pintados (ahí
van las pistas y las claves), los papelitos y cositas que se encuentran, y lo que el nivel marca a mano con
`c.proteger(obj)` (las estrellas de la puerta 8). Con eso:

- El desorden no se riega encima ni se queda quieto encima (si cae ahí, salta al sitio libre más cercano).
- La decoración fija del escenario que tape algo importante se quita mientras dura esa puerta (`despejar`: las piezas
  sueltas que se tocan entre sí van juntas, como la lámpara con su cable).
- La puerta 8 («Lo que brilla en la oscuridad»): las estrellas que forman 4-1-7 estaban arriba, detrás de la lámpara
  del techo y del corazón de la puerta. Ahora brillan a la derecha de la puerta, encima de la cajita, con un
  resplandor suave, donde nada las tapa (y las de adorno quedaron lejos del número).
- Revisión con rayos (`revisarImportantes` en `revisar.ts`): desde la cámara se lanzan rayos a puntos de cada cosa
  importante (en la vista general y en cada acercamiento que use el nivel) y se cuenta qué los tapa: la decoración, el
  desorden, el narrador en su esquina, otra pieza del acertijo que no se toca, la interfaz (los botones, el
  inventario con una cosa) o el borde de la pantalla. Lo que el acertijo esconde a propósito detrás de algo que se
  toca (la llave entre los cojines), lo enterrado (los topos en su hueco), lo que se ve a través (vidrios, brillos) y el
  piso, la arena o el mar no cuentan.

Lo de siempre de la puerta:

- La lámpara del techo de la casa cuelga a un lado (`LAMPARA` en `cuarto.ts`), los muebles de los acertijos están a
  los lados de la puerta, el narrador cuenta la historia desde un lado y celebra sin taparla, su globo se acomoda
  entre el borde de la pantalla y la puerta, el inventario va en columna a la derecha y los avisos abajo a la izquierda.
- Revisión automática: `window.__puertas.tapan()` pinta en una rejilla de la pantalla las hojas de la puerta y cuenta
  qué se les cruza desde la vista de siempre (objetos del cuarto y del acertijo, el desorden, el narrador contando, en
  la esquina y celebrando, y la interfaz con textos largos de prueba). `node scripts/_puertas_tapan.mjs 1 100` lo
  corre en 844×390, 740×360 y 1024×768 (con `?revisar=1`, sin dibujar). Lo que es parte de la puerta (las cadenas de
  la reja, el aro de luz de la compuerta, el brillo del corazón) se llama `marco…` y no cuenta.

## Revisión sistemática de las 100 puertas

`scripts/revisar-puertas.mjs` (con el servidor de Vite andando) recorre las puertas una por una con el desorden
puesto y varias semillas (`?semilla=N` cambia el reguero), resuelve cada una con su prueba automática (toques y
sensores de verdad) y registra lo que falle: la prueba no pasa o se traba, el panel no abre, la puerta no se abre,
algo tapa la puerta o algo importante (con los rayos de arriba, también en los acercamientos), cosas que quedaron fuera
del cuarto o con posiciones rotas, y errores de la página. Con `--revolver` antes de resolver tira todo el desorden
por el aire y revisa otra vez cuando se queda quieto; con `--fotos` guarda una foto de cada puerta (sin fotos corre sin
dibujar, mucho más rápido). El informe queda en `<carpeta>/informe.json`.

    PUERTO=5173 node scripts/revisar-puertas.mjs 1 100 --semillas=0,1,2 --revolver [--fotos]

La revisión mira cuando todo quedó quieto (y otra vez medio segundo después, porque el narrador al caminar a su
esquina puede empujar algo). Lo que va y viene solo (la botella entre las rocas, el carrusel) se marca con
`userData.seMueve` y lo que tapa a propósito (la tapa con ventanita del letrero giratorio) con `userData.tapaAdrede`:
eso no cuenta como tapado. Con `DEPURAR=1` imprime dónde quedó cada cosa del reguero cuando algo tapa la puerta.

### Arreglos de la revisión (octubre de 2026)

Pasada completa con `--semillas=0,1,2 --revolver` (300 puertas): de 46 fallas a 0. Lo que salió y cómo quedó:

- **Puerta 44 (el cangrejo)**: lo rápido que se frota se mide con el reloj de verdad (lo rápido es del dedo, no de la
  escena). **Puerta 97 (la caja musical)**: el ritmo de los círculos también va con el reloj de verdad y se mide en una
  ventanita de 0,4 s: si el celular se atasca un momento y los toques llegan juntos, ya no cuenta como «muy rápido» y
  la cuerda no se devuelve. **Puerta 56 (el equilibrio)**: la pelota avanza en pasitos de 8 ms como mucho, así un
  cuadro lento no la hace saltar de golpe (el roce es el mismo por segundo).
- **El desorden** que tapaba la puerta o los papelitos después de revolverlo todo (puertas 4, 19, 21, 24, 29, 44, 71,
  74, 79, 86, 91, 96, 97 y 99): ver «Nunca tapan» y «Los papelitos se asoman» arriba.
- **Los avisos de abajo** salían en una columnita de una palabra por línea: el `.aviso` de la casa (las burbujitas de
  las necesidades, de 34 px) también se carga en Cien Puertas. Ahora el de las puertas va con su id y manda.
- **Puerta 14**: el árbol de manzanas, un poco más bajito para que la copa quepa entera. **Puerta 23**: los platillos
  de la balanza ya están colgados desde el principio (antes, hasta el primer cuadro, quedaban en el piso frente a la
  puerta). **Puerta 39**: la banda de las maletas entera en la pantalla. **Puerta 60**: las cosas del tocón apoyadas
  encima (la piña estaba medio hundida). **Puerta 67**: los globos de abajo ya no quedan detrás del mostrador.
  **Puerta 68**: el carrusel corrido para no meterse debajo de los botones.

## En pareja: la misma puerta, cada uno en su celular

Botón «En pareja» del mapa (o la invitación que llega a la casa): se invita a la puerta que sigue o a una del mapa, y
los dos la resuelven al tiempo, cada uno en su celular (`src/puertas/pareja*.ts`).

- **Cómo viaja**: canal de Supabase Realtime de la pareja (`puertas-<pareja>`, broadcast + presencia, la misma sesión
  de la casa). Quien invita es el **anfitrión**: aplica las reglas del acertijo; el **invitado** arma la misma puerta
  (mismo montaje y el mismo reguero, que le llega del anfitrión porque las pantallas no miden igual) y la ve en espejo.
- **Paquetes** cada 125 ms (si hay algo que decir) y un latido cada segundo. Los movimientos van numerados y se repiten
  en cada paquete hasta que el otro confirma (un mensaje perdido no daña nada); lo que solo vale en su última versión
  (la foto del cuarto, el candado abierto, las texturas pintadas) se repite hasta que el otro dice qué versión tiene.
- **Los dedos del invitado** viajan con su cámara y su pantalla, y el anfitrión los aplica como si fueran propios
  (`Entrada.remoto`): tocar, mantener, arrastrar, frotar, deslizar, dibujar. Lo que arrastra se mueve de una en su
  celular (no espera la red) y el espejo no se lo quita de la mano. Los sensores del invitado (sacudir, voltear,
  cerrar los ojos, soplar) también llegan, y su inclinación cuenta cuando el celular del anfitrión está quieto.
- **El espejo** (`pareja_espejo.ts`): el anfitrión manda solo lo que cambia (posición, giro, tamaño y si se ve de cada
  cosa del acertijo, del desorden y de lo pegado a la puerta; colores de los materiales propios; luces; texturas
  pintadas, como el vidrio que se limpia; el inventario y la luz del cuarto), y cada segundo y medio todo lo que ha
  cambiado. El invitado lo aplica suavecito. Los sonidos de los acertijos suenan en los dos (`sonido_eco.ts`).
- **Candados y notas**: le salen a quien los tocó (el anfitrión los arma sin verse y los botones viajan). Lo mismo los
  acercamientos de la cámara.
- **Compartido**: el inventario (lo que uno recoge lo tienen los dos), las pistas (si uno le compra un dulce al
  narrador, el narrador se la dice a los dos) y las monedas (la casa es una: las paga el anfitrión).
- **Se ve dónde toca el otro**: una manito con su carita (`retratos/el.png`, `ella.png`) que se desvanece al ratico.
- **Señas** (botón del globito con corazón): «¡Mira aquí!» (con un aro que late donde uno tocó), «¡Ya sé!», «¿Me
  ayudas?», «¡Muak!» y **escribirle una notica** (le sale como un pos-it: sirve para dictar «4 1 7»). Las señas
  usan cómo se dicen: Él a Ella «esposa», «pulga aventurera», «protagonista»; Ella a Él «panda», «perro lanudo»,
  «liefje» (y «mi amor»).
- **Puertas repartidas** (como «We Were Here»): en la 8, 25, 31, 38, 43 y 70 uno ve la pista y el otro tiene el
  candado (se turnan de una puerta a otra). Quien no la ve tiene una nubecita rosada encima que dice «Esto lo ve Él»;
  si toca la pista o si el que la ve intenta abrir el candado, le sale un aviso amable. Se declara en el nivel con
  `pareja: { pista: [nombres] }`. La puerta 100 dice que cada uno ponga su pulgar en una huella (`pareja.aviso`).
- **Pausa**: si uno se va a segundo plano (`segundo_plano.ts`) o se corta la conexión (4,5 s sin noticias), al otro le
  sale la pausa con aviso y todo se queda quieto; al volver sigue donde iba. Si uno sale, al otro le avisan.
- Prueba: `node scripts/probar-puertas-linea.mjs http://localhost:5173/puertas.html` (dos celulares con pantallas
  distintas, un Supabase de mentiras con demoras y 8 % de mensajes perdidos: Ella resuelve una puerta con sus dedos,
  Él otra con su prueba, señas, pausa por segundo plano y por corte, candado que le sale a Ella, y al final de cada
  parte los dos estados tienen que ser idénticos).

## Efectos

`src/puertas/efectos.ts`: ondita al tocar (dorada si se tocó algo), la puerta se abre con rayos de luz del color del
capítulo, polvito dorado que sale por la puerta y chispas en la cerradura; el corazoncito del recuerdo sale de la
puerta y se va volando; confeti de corazones y estrellas por los lados (sin tapar la puerta); las estrellas ganadas
arriba; y entre puerta y puerta la tarjeta con el número (y el capítulo cuando cambia) sobre el fundido, mientras se
arma la siguiente, que se destapa con la cámara asentándose. Mientras la puerta se abre, la interfaz se hace a un
lado (semitransparente). Todo con dos nubes de partículas reutilizadas.

## Técnica

- Página propia `puertas.html` + `src/puertas/`: escena 3D en primera persona con el mismo estilo de plastilina
  (luces suaves, `RoomEnvironment`), cuartos armados con piezas simples y modelos de la casa y la tienda.
- `sensores.ts` junta los sensores con su alternativa; en pruebas se simulan (teclas y `window.__puertas`).
- Cada puerta es un módulo con su montaje, su lógica, sus pistas y una **prueba** que la resuelve con toques y
  sensores simulados, para verificar que las 100 se pueden pasar.
- Progreso en el celular (`localStorage`); las monedas llegan a la casa compartida.
- Pruebas: `scripts/revisar-puertas.mjs` (arriba) y `scripts/probar-puertas-linea.mjs` (pareja). Parámetros:
  `?puerta=N`, `?sinhistoria=1`, `?rapido=N`, `?semilla=N`, `?una=1` (al abrirse no sigue), `?revisar=1` (sin dibujar).
  `window.__puertas` tiene `jugar(n)`, `probar()`, `estado()` (con `listo`), `revision()`, `revolver(s)`, `quieto()`,
  `papelitos()`, `tapan()`, `desorden()`, `lanzar(i, vx, vy, vz)`, `antojo()`, `pareja()`, `parejaInvitar(n)` y
  `segundoPlano(si)`.
- El bucle de dibujo usa `cuadros()` de `src/segundo_plano.ts` (se detiene solo en segundo plano) con tope de 30
  cuadros por segundo.
