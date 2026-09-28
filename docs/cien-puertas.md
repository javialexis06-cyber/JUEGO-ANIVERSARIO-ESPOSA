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
  inmediata (la puerta abriéndose) y variedad constante de mecánicas.
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
- **Al empezar** cada puerta: 1–2 frases de ambiente; a veces esconden una pista («llamábamos con tres golpecitos
  y uno largo»). Se pasa tocando y el narrador se corre a su esquina.
- **Durante** la puerta: solo ánimo, nunca pistas, y poco: tras varios intentos fallidos o un buen rato quieto
  («Tú puedes, yo te espero aquí»), máximo dos veces por puerta, en un globito que se va solo. Cuando algo sale
  bien, sonríe (sin texto).
- **Al terminar**: felicita y dice algo bonito («Contigo hasta las puertas más difíciles se abren»).
- Las pistas son aparte: un bombillo que aparece al rato, con dos niveles (una idea y luego casi la respuesta).
- Se puede cambiar todo el texto en `src/puertas/historia.ts` (por ejemplo, poner recuerdos propios).

## Los recuerdos (de verdad)

Al abrir la última puerta de cada capítulo vuelve un recuerdo: aparece una tarjeta tipo polaroid y los dos lo
cuentan en una conversación (el narrador en su globo y quien juega abajo, con su nombre). A veces no se ponen de
acuerdo en cómo pasó, para que dé risa. Quedan guardados en «Recuerdos» del mapa para volver a leerlos.

| Cap. | Recuerdo | Lo que discuten |
|---|---|---|
| 1 | La villa de Transformice (15 de septiembre) | ¿Lo quería estafar o no? «Estás como necesitada, así que ten» |
| 2 | Matemáticas, filosofía y buscarnos | Ella lo buscó por todo el juego… ¿él de verdad la estaba buscando? |
| 3 | El 25 de octubre | ¿Treinta días o cuarenta? (del 15 de septiembre al 25 de octubre) |
| 4 | La primera vez que nos vimos | «Eras perfecta» — «¿Era?» |
| 5 | Cartagena | La moto acuática, y ella durmiendo en el aeropuerto mientras él estaba en un hotel cinco estrellas |
| 6 | Las luces de diciembre en Medellín (con Disney) | ¿Las luces o los ojos de ella? |
| 7 | Halloween elegante | «Me derrite» — «Dímelo otra vez» |
| 8 | Un cumpleaños de reina | El restaurante de súper lujo… y quién pagó |
| 9 | El planetario del Parque Explora | ¿Quién miraba a quién? |
| 10 | Para siempre | La propuesta en la casa, Lexy Katherine, los labios y la sonrisa, abrazados en camita |

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
| 1 | La llave está bajo el tapete: correrlo, tomar la llave y usarla en la cerradura | arrastrar, inventario |
| 2 | Llamar como llamábamos: tres golpecitos y uno largo (lo dice la historia) | ritmo de toques |
| 3 | Prender las lámparas en el orden de colores del cuadro | secuencia |
| 4 | La llave se perdió entre los cojines del sofá: levantarlos | deslizar |
| 5 | El timbre está pegado: tocarlo muchas veces seguidas | toques rápidos |
| 6 | Laberinto de canica en la pared: llevarla al hueco | inclinar |
| 7 | La foto de los dos rota en cuatro: armarla; atrás está el código | rompecabezas + candado |
| 8 | «Algunas cosas solo brillan en la oscuridad»: apagar la luz y leer las estrellas del techo | interruptor + código |
| 9 | El reloj de la sala sin manecillas: ponerlo en la hora del celular | girar, hora real |
| 10 | La llave cuelga de la lámpara del techo | sacudir |
| 11 | La semilla tiene sed: echarle agua con la regadera | inclinar para verter |
| 12 | Pintar las flores como las alas de la mariposa | colores |
| 13 | Topos: pegarles hasta que salga el de la llave | reflejos |
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
| 24 | La rocola: repetir la canción | memoria de sonidos |
| 25 | La cuenta: el total es la clave | sumar |
| 26 | El vidrio del café se empaña: soplar | soplar |
| 27 | Galletas de la fortuna: armar la palabra con sus letras | anagrama |
| 28 | Las tres tazas: seguir la que tiene la llave | seguimiento |
| 29 | El letrero giratorio: girarlo con dos dedos para leerlo | girar con dos dedos |
| 30 | El letrero dice CERRADO… al voltear el celular dice ABIERTO | voltear 180° |
| 31 | El mapa tiene un corazón en Cartagena: buscar su andén en el tablero de salidas | leer y deducir |
| 32 | La maleta de tres números: los sacan las calcomanías | contar + candado |
| 33 | Letras que giran en el tablero: pararlas en TE AMO | tiempo justo |
| 34 | El torniquete: pasar el tiquete de un deslizón, ni lento ni rápido | deslizar con velocidad |
| 35 | Trazar la ruta en el mapa sin repetir carretera | camino |
| 36 | Tres relojes: poner el cuarto con la misma regla | lógica |
| 37 | El bus se mueve: sostener el celular quieto hasta que las pelotas caigan | quieto |
| 38 | La máquina de dulces se trabó: sacudirla | monedas + sacudir |
| 39 | La banda de maletas: tomar la que dice la etiqueta | observar |
| 40 | El túnel: cerrar los ojos (apagar la pantalla) y volver a abrirlos | pantalla |
| 41 | Ordenar las conchas de menor a mayor | ordenar |
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
| 65 | El martillo de fuerza | toques rápidos |
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

- Primera vez que se abre una puerta: +5 monedas para la casa (pasan como el sueldo del súper). Terminar un
  capítulo: +40 y un recuerdo nuevo en el mapa de puertas.
- Estrellas por puerta (1–3) según tiempo y si se usó la pista; no bloquean nada.

## Técnica

- Página propia `puertas.html` + `src/puertas/`: escena 3D en primera persona con el mismo estilo de plastilina
  (luces suaves, `RoomEnvironment`), cuartos armados con piezas simples y modelos de la casa y la tienda.
- `sensores.ts` junta los sensores con su alternativa; en pruebas se simulan (teclas y `window.__puertas`).
- Cada puerta es un módulo con su montaje, su lógica, sus pistas y una **prueba** que la resuelve con toques y
  sensores simulados, para verificar que las 100 se pueden pasar.
- Progreso en el celular (`localStorage`); las monedas llegan a la casa compartida.
