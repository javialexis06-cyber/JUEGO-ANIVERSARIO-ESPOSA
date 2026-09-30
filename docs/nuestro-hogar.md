# Nuestro Hogar · la mascota de pareja

El juego principal: una casita para Él y Ella. Cada uno abre la app en su celular (Bucaramanga y Medellín), cuida a
su personaje y consiente al del otro. Lo que hace uno le llega al otro al instante (Supabase, ver
[`supabase.md`](supabase.md)). El súper de barrio (Súper Manía) queda como **minijuego** que paga monedas para la casa.

## La casa

Cuatro cuartos tipo diorama, en plastilina como las tiendas (`personajes/blender/casa.py`):

| Cuarto | Qué se hace | Efecto |
|---|---|---|
| Sala | Descansar en el sofá · Ver tele (sentados) | +8 energía · +4 energía y +2 cariño |
| Cocina | Comer (sentado en la silla del comedor, con la comida en la mano) · Notas en la nevera | según la comida |
| Baño | Bañarse (en la tina con burbujas) · Lavarse en el lavamanos | higiene al 100 · +25 higiene |
| Cuarto | Dormir (acostado en la cama) · Cambiarse en el clóset | +16 energía por hora dormido · +12 higiene |

Se cambia de cuarto con las pestañas de abajo (solo los cuartos construidos; si no caben, se desplazan de lado) o
con el **plano** (la casita amarilla al principio de las pestañas): la casa vista desde arriba, tres pisos de a tres
cuartos, con la carita de quién está en cada uno. Cada pestaña muestra la carita de quién está ahí. Tu personaje va
contigo: camina hasta la puerta del cuarto donde está (la cámara lo espera un momento), sale y entra caminando por
la puerta del otro cuarto. El de tu pareja se queda donde está (lo que se ve es su estado). Dormido no se levanta:
la pestaña solo muestra el cuarto.

Tocar el piso hace caminar a tu personaje hasta ahí; tocar al otro abre su hoja; tocar la nevera abre las notas.
Tocar un mueble lo usa: el sofá, la tele, la tina, la cama, el arcade, la cuna, la mecedora, el tocador…
Cualquier orden nueva (tocar el piso, otra acción, otro cuarto u otro mimo) corta lo que estaba haciendo: se levanta
del sofá o de la silla, suelta la comida y va a lo nuevo (el otro celular lo ve igual).

### Caminos y muebles

- Cada cuarto tiene una cuadrícula de caminos (`src/navegacion.ts`, casillas de 12,5 cm) con la huella de los
  muebles que llegan a la altura del cuerpo, medida del propio modelo (`Casa3D.nav`), y de la decoración de piso
  que pongan (plantas, lámparas, estantería…); se rehace al decorar. Los personajes la rodean con A*.
- Los puntos donde se sientan, se bañan o se acuestan traen un **acceso** (`personajes/blender/casa.py`, cuarto
  elemento de `PUNTOS`, que va a `casa.json`): los pasos para llegar sin atravesar el mueble. Sofá: por detrás de
  la mesa de centro, de lado; silla del comedor: por delante (el lado sin espaldar); tina: por delante, subiendo por
  encima del borde; cama: por el lado de cada uno. Se sale por los mismos pasos al revés.
- Alturas del cuerpo medidas contra cada mueble (`ALTO` y `SUBIR` en `mascota.ts`): sofá 0,48 (sentado sobre el
  cojín, la espalda contra el espaldar), silla 0,34, tina 0,12, cama 0,74 y recostado a 76° para que la cabeza quede
  en la almohada y no contra la cabecera.
- Los mimos se hacen a un lado del otro que quede libre (si ese lado cae dentro de un mueble, del otro lado); a quien
  duerme se le da desde el lado de su cama. La cajita de regalo aparece sobre piso libre.

## Ampliar la casa

Menú → **Ampliar la casa** (o el plano): los cuartos que faltan salen punteados con su precio y se construyen con
las monedas de los dos (`casa.ampliaciones`). Se cargan en 3D solo cuando existen (`Casa3D.asegurar`), así la casa
abre igual de rápido. Modelos en `personajes/blender/casa.py` (sección «Ampliación»); se exportan solo los nuevos
con `CASA_SOLO=juegos,trofeos,cuna,cuarto_el,cuarto_ella,bebe,ciguena python3 exportar_glb.py <salida> casa`
(`casa.json` sale siempre completo; a las piezas chiquitas se les baja el suavizado para que pesen menos).

| Cuarto | Precio | Qué tiene y qué se hace |
|---|---|---|
| Juegos | gratis (viene con la casa) | Los **minijuegos ya no están en el menú**: arcade de Súper Manía (con la pantalla prendida), la **puerta 100** morada de Cien Puertas y la mesa con el parchís servido (dos pufs). El personaje camina al arcade, a la puerta o se sienta en el puf, y de ahí se entra al juego. También el retrete espacial en miniatura (sus récords) |
| Trofeos | 50 | Cuatro pedestales de mármol con los trofeos de cada minijuego, vitrina de medallas, alfombra roja y el podio de la **copa del amor**. «Admirar»: aplaude frente al mejor trofeo |
| Bebé | 150 | Cuna de barrotes con móvil de estrellas, mecedora, cómoda con cambiador y juguetes. **Pedir a la cigüeña**: se escoge el nombre (Katherine, como dice Él, o Lexy Katherine, como dice Ella, u otro) y la cigüeña entra volando por la ventana con la bebé en un pañuelo y la deja en la cuna (`casa.bebe`). Luego: arrullarla (la cuna se mece, suena una nanita), la mecedora (se mece de verdad) y tocarla (se ríe) |
| Cuarto de Él | 80 | Escritorio con computador (la pantalla escribe código), silla gamer, sillón, repisa y balón |
| Cuarto de Ella | 80 | Tocador con espejo de bombillitos y taburete, escritorio de estudio (libros de psicología y un cerebrito rosado), sillón y repisa |

Los cuartos propios tienen 8 o 9 sitios de decoración y **solo su dueño los decora y les pinta las paredes**
(«Pintar»: 15 colores, `casa.pintura`); el otro puede entrar y sentarse en el sillón, pero ni le sale el botón de
decorar.

### Trofeos

Cada minijuego da bronce, plata y oro con lo mejor de los dos (`src/casa/trofeos.ts`):

| Juego | Bronce | Plata | Oro | De dónde sale |
|---|---|---|---|---|
| Súper Manía | 5 | 25 | 60 estrellas (lunas incluidas) | `supermania-jugable1` |
| Cien Puertas | 10 | 50 | 100 puertas | `cien-puertas` |
| Juegos de mesa | 1 | 10 | 30 partidas ganadas | `nuestro-hogar-victorias` (lo cuenta `mesa.html`) |
| Retrete espacial | 15 | 45 | 90 segundos | `casa.retrete` |

Al abrir la app, lo de cada celular sube a la casa (`casa.logros`, se guarda el máximo). Cada metal nuevo paga una
vez 5, 10 o 20 monedas; la **copa del amor** es del metal del trofeo más bajito (paga el triple). En la sala se ven
en sus pedestales dando vueltas despacito (sin ganar: una silueta clarita).

## El patio y el perrito (estilo Pou / Talking Tom)

El **patio** viene con la casa (pestaña «Patio», abajo del plano): grama, la fachada con su alero de tejas, cerca de
madera, cerquita blanca, árbol de mango con columpio de llanta, banca debajo de la ventana (para sentarse), la
**casita del perro** con su nombre en el letrero, los platos de cuido y agua, la tina de lata con el patito, flores,
caminito de piedras y guirnalda de bombillos (`casa.py`, sección «El patio»).

**Adoptar** (botón del patio): perrito o perrita, nombre (Canela, Toby, Maní, Luna, Coco, Lucas u otro) y color
(caramelo, chocolate, negrito, gris, con manchas o dorado). Es de los dos (`casa.perro`); entra corriendo por la puerta.

El perrito (`personajes/blender/perro.py` → `perro.glb`) es un cachorro de plastilina por piezas con bisagras
(cuerpo, cabeza, orejas, cejas, cola y patas) y caras que se prenden y apagan (ojos abiertos, felices ^ ^ o
cerrados; boca cerrada o abierta con la lengua). En el juego se anima con código (`src/casa/perro.ts`): camina
esquivando los muebles, respira, parpadea y mueve la cola según su ánimo (triste: orejas y cola gachas).

**Jugar con él** (o tocarlo) abre el **modo mascota** (`src/casa/patio.ts`): la cámara se le acerca, arriba sus 4
barras y abajo botones grandes:

| Botón / toque | Qué pasa | Efecto |
|---|---|---|
| Comida → Cuido | va al plato y come (crunch, crunch) | +40 comida (gratis) |
| Comida → Huesito | lo pide sentado en dos patas | +15 comida, +25 alegría (2 monedas) |
| Bañar | se mete a la tina de un brinco, espuma y burbujas; sale y se sacude salpicando | limpieza al 100 |
| Pelota (o tocar la grama) | la pelota vuela a donde se tocó; corre, la trae en la boca y la suelta | +12 alegría, −4 energía |
| Dormir / Despertar | se va a su casita y duerme (zzz); la energía sube también con la app cerrada | |
| Trucos | sentado (nivel 1), dar la pata (2), rodar (3), hacerse el muerto (4), saltar (5), pedir (6) | +4 alegría |
| Háblale (mantener apretado) | pone las orejas a escuchar y repite lo que le dijeron con vocecita (micrófono) | +3 alegría |
| Tocar la cabeza | caricia: ojos felices, ladea la cabeza, cola a mil, corazones | +4 alegría |
| Tocar la barriga | cosquillas: panza arriba pataleando y riéndose | +5 alegría |
| Tocar la cola | se enoja: cejas bravas, gruñe y ladra | −3 alegría |
| Tocar la nariz | estornudo («¡achís!») | +2 alegría |
| Tocar una pata | da la pata (o se sienta si aún no aprende) | |

Las necesidades bajan con el reloj real (comida 6, energía 4, limpieza 3 y alegría 5 por hora; dormido la energía
sube 20 por hora). Si algo baja de 30 sale un globito con lo que necesita. Un rato después de comer aparece un
**popó** en la grama (hasta 3; ensucian y aburren): se recoge tocándolo. Cada cuidado da puntos y el perrito sube de
**nivel** (2 a los 20 puntos, 3 a los 80, 4 a los 180…) y aprende trucos nuevos. Lo que le hace uno (comer,
bañarse, irse a dormir) también se ve en el celular del otro si está mirando el patio.

## Ir al baño y el retrete espacial

- **Ir al baño** (en el baño): se sienta en el inodoro y pone caras exageradas mientras piensa cosas
  («¡Ugh!», «¿Y el papel?», «¡Victoria! 😌»).
- **Lo que les cae pesado**: a Ella la leche (vaso de leche, yogur, arroz con leche) y a Él el picante
  (empanada con ají, tacos), comido por uno mismo o llevado por la pareja. Le sale un globito con un
  inodoro que tiembla y el botón «Ir al baño» se pone en rojo.
- Con esas ganas, en el inodoro todo tiembla, echa humo y **sale disparado por el techo al espacio**: un
  minijuego de esquivar asteroides arrastrando el dedo (el personaje de verdad, vestido como está, sentado
  en el inodoro con fuego de cohete). Mientras vuela dice cosas («Siempre supe que algún día saldría como
  un cohete del baño», «Intolerante a la lactosa… y ahora astronauta»…). Se gana por el tiempo que aguante
  (1 moneda cada 15 s, hasta 3).
- Al chocar, cae dando vueltas y **aterriza en el baño con un ¡KABOOM!** (humo, sacudón). El marcador
  compartido guarda el récord de cada uno (`casa.retrete`) y se ve en el cuarto de juegos → Retrete espacial.
  Código: `src/casa/cohete.ts`.

## Recuerdos en el baño y abrazados en la cama

- **Bañarse** dura 30 s: en la tina quedan en ropa interior (Él sin camisa y en bóxer, Ella en ropa
  interior rosada; la ropa comprada se esconde salvo el peinado) y al salir se vuelven a vestir.
- Mientras tanto sale una burbuja de pensamiento con **recuerdos** al azar (10–15 s cada uno): los 20
  recuerdos de verdad de Cien Puertas, cada uno con su dibujito animado y lo que se dijeron.
- **Dormir** se puede aunque no tengan sueño (una siesta: se despiertan solos con la energía llena y
  después de media hora, o con «Despertar»). Si los dos duermen, se abrazan: boca arriba juntitos o en
  cucharita (el mismo en los dos celulares), y la burbuja mezcla recuerdos, **discusiones bobas** («¿treinta
  días o cuarenta?», «¿Katherine o Lexy Katherine?»…) y **deseos a futuro**. Código: `src/casa/recuerdos.ts`.

## La tele (YouTube)

- **Ver tele** en la sala: el personaje se sienta en el sofá y la tele se pone a pantalla completa, con la casa
  chiquita en una esquina (los dos en el sofá). Se pegan enlaces de YouTube (youtu.be, watch, shorts,
  music; con o sin https) y quedan en una **cola**: al acabarse un video empieza el siguiente. Cada video de la
  cola se puede ver ya, subir o quitar.
- **Levantarse**: la tele sigue prendida en una ventanita (se ve y se oye); en la tele de la sala salen
  dibujitos animados de los dos. Tocar la ventanita es volver al sofá.
- **Apagar**: desde «Ver tele → Apagar la tele» o con ⏻ a pantalla completa.
- Videos que no dejan verse fuera de YouTube: aviso y sigue el próximo. La cola y el segundo donde iba se
  guardan (`nuestro-hogar-tele`); al abrir la app, la ventanita muestra el video en pausa.
- Mientras la tele está en grande se quedan sentados (la acción `tv` se alarga de a 20 minutos); si se cierra
  la app, a los 20 minutos se paran solos. Código: `src/casa/tele.ts` (pruebas sin internet con `?tele-falsa`).

## Necesidades

Comida, energía, higiene y cariño (0 a 100). Bajan con el reloj real, **también con la app cerrada**
(por hora: comida 8, energía 6, higiene 4, cariño 5; dormido la comida y la higiene bajan a la mitad y la energía sube 16).

- La cara muestra el ánimo (la necesidad más baja): feliz ≥ 60, normal ≥ 30, triste por debajo (cara y pose tristes).
- Con poca higiene aparece barro en la cara y la ropa (3 niveles).
- Si algo está por debajo de 30, sale un globo de pensamiento con lo que necesita.
- Despierta solo cuando la energía llega a 100 (o con el botón Despertar).

## Mimos con la pareja

| Mimo | Tu cariño | Su cariño |
|---|---|---|
| Caricia | +4 | +10 |
| Abrazo | +15 | +15 |
| Beso | +20 | +20 |
| Nalgadita (solo Él) | +8 | +5 |

La **nalgadita** solo le sale a Él (en la hoja de Ella, estando juntos; no si ella duerme). Súper exagerada: él
llega por detrás, se frota las manos («Jejeje… 😏»), levanta la mano y brinca hacia ella: **¡PLAF!** de cómic con
estrellitas, la manito marcada y sacudón de pantalla. Ella pega un brinco («¡¡AAAY!! 😱»), cae de espaldas al piso
llorando y pataleando de berrinche («¡Me dolióoo! 😭») mientras él da dos vueltitas muerto de la risa, y al final ella
se levanta de brazos cruzados («¡Ya verás! 😤») y él presume («Esa nalguita es mía 😎»). En el celular de ella se ve
igual (evento `nalgada`).

Los mimos no dan monedas. Se hacen **estando los dos en el mismo cuarto**: el botón con el nombre de la pareja solo
aparece entonces (y aparece o se va en vivo cuando uno entra o sale). Tocar su carita de arriba abre igual su hoja:
lejos muestra cómo está y «Ir a …» (tu personaje camina hasta ese cuarto), además de notas y mensajes de voz, que
llegan desde donde sea. Juntos, tu personaje se acerca, se ponen de perfil y posan con corazones; si el otro estaba
sentado se levanta primero. Si el otro está dormido, sonríe entre sueños. También se puede **llevarle comida** (sube
su comida), **regalar**, **saludar** y **dejar notas** en la nevera (se ven pegadas en la puerta).

## Regalos

Se compran en la tienda y se entregan con un mensaje. A quien lo recibe le aparece una cajita junto a su personaje;
al abrirla ve el regalo, el mensaje y sube su cariño.

| Regalo | Precio | Cariño | Extra |
|---|---|---|---|
| Carta de amor | 2 | +15 | |
| Cajita sorpresa | 5 | +20 | trae una comida al azar |
| Chocolates | 7 | +25 | +8 comida |
| Ramo de flores | 8 | +30 | |
| Osito de peluche | 13 | +40 | se queda para decorar |

## Mensajes de voz (como una llamada)

- En la hoja de la pareja: «Mensaje de voz». Se graba hasta 30 segundos (con onda y reloj), se puede oír y repetir,
  y enviarlo cuesta 4 monedas de la casa.
- A quien lo recibe le suena el teléfono (timbre y vibración) con la carita de quien llama: «Contestar» o «Después».
  Al contestar suena el mensaje; al terminar puede oírlo otra vez o «Responder» con otro mensaje.
- Oír un mensaje nuevo sube 20 de cariño. Si llegó mientras la app estaba cerrada, aparece el botón «Mensaje de voz».
- Todos quedan en el menú → «Buzón de voz». En línea el audio va a la carpeta privada de la casa en Supabase
  (la misma de las fotos, no hay que correr nada nuevo); sin internet quedan en el celular (los últimos 6).

## Monedas (de los dos)

Se ganan poco y despacio (se bajó a la cuarta parte: con lo de antes se compraba todo en pocos días).

| De dónde | Cuánto |
|---|---|
| Bono del día (al abrir la app) | +5 para cada uno (antes 20) |
| Aniversario | +13 una vez al año (antes 50) |
| Mimos, saludos y demás con la pareja | nada (antes 5 a 10 los primeros del día) |
| Minijuegos (súper, Cien Puertas, juegos de mesa) | lo que pague cada juego (cada uno paga la cuarta parte de antes); llega por `nuestro-hogar-sueldo` y la casa lo suma tal cual, sin volver a dividirlo |
| Trofeos | 5 / 10 / 20 por bronce, plata y oro de cada juego (una vez); la copa del amor, el triple |
| Casa nueva | empieza con 40 (antes 120) |

Precios: lo de todos los días se abarató a un tercio para que el cuidado siga alcanzando; lo que se colecciona quedó
igual, así que ahora cuesta días.

| Qué | Precio | Con lo que se gana |
|---|---|---|
| Comida | 1 a 7 (pan 2, arepa 3, pizza 5, bandeja paisa 7) | ~8 de comida por moneda: el bono del día da para 1 o 2 comidas |
| Regalos | 2 a 13 | un día de bono o una partida |
| Mensaje de voz | 4 | |
| Tintes | 20 | 1 a 2 días jugando |
| Decoración | 15 a 80 (la mayoría 30 a 45) | 2 a 4 días jugando un rato (unos 20 a 30 al día entre los dos con minijuegos; 10 solo con los bonos) |
| Ropa | 10 a 120 (la mitad cuesta 40 o menos) | igual que la decoración |
| Disfraces | 40 a 295 (las piezas con 25 % de descuento) | de unos días a dos semanas: el premio grande |
| Cuartos nuevos | 50 (trofeos), 80 (cada cuarto propio), 150 (bebé) | de unos días a una semana |

## Decoración

Botón Decorar: aparecen aros rojos en los sitios del cuarto (pared, piso, mesa, sofá/cama). Se pone lo que tengan
guardado; quitarlo lo devuelve. Cuadros (corazón, montañas y **marco con una foto del álbum**), matera, cactus,
lámpara, globos, osito, florero y velas (`personajes/blender/regalos.py`), y 45 más de `deco_nueva.py`: cuadros
(atardecer, flores, la pareja, mapa, noche, gatito), reloj, espejo, guirnalda de luces, banderín, letrero «TE AMO»,
plantas (monstera, girasoles, palma, bonsái, suculentas), árbol de Navidad, guitarra, puf, estantería, lámparas,
pecera, tocadiscos, globo terráqueo, caja musical, bola de nieve, radio y peluches (conejo, gato, dino, perro,
pingüino, unicornio, panda, elefante, corazón).

La comida también creció con `comidas.py`: 31 platos colombianos y antojos (empanadas, buñuelos, pandebono, arepa
con queso, bandeja paisa, ajiaco, tamal, obleas, cholado, mango biche, mazorca, churros, arroz con leche, perro,
hamburguesa, salchipapa, sushi, tacos, fresas con crema, brownie, dona, cupcake, flan, galletas, chocolate, té,
limonada, malteada, palomitas, sandía y ensalada de frutas).

## Ropa, peinados y disfraces (el clóset)

Cada uno viste a su personaje. En la tienda, pestaña **Ropa**, se filtra «Para Él / Para Ella» y por parte del
cuerpo; lo que se compra queda en el **clóset** (botón «Cambiarse» en el cuarto, o «Cambiar ropa y peinado» en la
hoja del personaje), donde se pone y se quita cuando quieran. La ropa se compra una sola vez.

| Parte | Ejemplos |
|---|---|
| Peinado | rapado, de lado, afro, rizos, mohicano, colita, largo, copete (Él) · cola alta, moño, trenzas, corto, rizado, colitas, flequillo, ondas (Ella) |
| Cabeza | gorras, boinas, gorros de lana y de Navidad, sombreros (vueltiao, paja, vaquero, bruja, pirata, copa), corona, tiara, diademas, orejitas, cuernos, aureola, capuchas de animal |
| Cara | gafas redondas, de sol, de corazón y de estrella, antifaz, parche, nariz de payaso, bigotes |
| Arriba | camisetas (lisas, corazón, pareja, rayas, héroe, fútbol), buzos, suéteres, camisas, hawaianas, cuadros, chaquetas, chalecos, sacos, blusas, uniformes |
| Abajo | pantalones, joggers, bermudas, shorts, faldas, tutú, pijamas · vestidos, overoles y pijamas enterizas ocupan arriba y abajo |
| Zapatos | tenis, botas, vaqueras, de lluvia, sandalias, pantuflas de animal, zapatos, tacones |
| Espalda y cola | capas, alas (ángel, mariposa, abeja, murciélago), mochilas · colas de gato, conejo, oso, dino, diablo y zorro |

- Cada modelo trae varias versiones de color (camiseta blanca, roja, amarilla…).
- **Tintes de pelo** (20 monedas, sirven para los dos): castaño, rubio, pelirrojo, rosado, lila, azul, menta,
  plateado… Se elige el color en la pestaña Peinado del clóset.
- **Disfraces de pareja**: gatitos, conejitos, ositos, pandas, dinos, unicornios, súper héroes, piratas, brujos,
  angelito y diablito, abejitas, chefs, novios, rey y reina, vaqueros, hinchas de la selección, Navidad,
  astronautas, payasitos, doctores y hawaianos. Traen todas las piezas para los dos con 25 % de descuento y se
  ponen de una vez desde el clóset.
- Lo puesto se guarda en el estado de cada personaje (`ropa` y `colorPelo`) y la pareja lo ve en línea.

## Recuerdos y fechas

- **Álbum**: fotos con título y fecha (se reducen a 1280 px). En línea van a la carpeta privada de la pareja.
- **Fechas**: el aniversario y otras fechas (cumpleaños, primera cita…) con cuenta regresiva; arriba aparece
  «Faltan N días» cuando falta un mes o menos. El día del aniversario llueven corazones.
- Al volver a la app: «Mientras no estabas, Ella te dejó 2 besos y 1 regalo».

## Técnica

- Personajes con esqueleto: una animación fija por pose (tienda + mascota) mezclada con pesos; las caras se arman
  mostrando mallas ocultas (ojos felices, boca de beso, de hablar, triste, barro) y parpadean solas.
- Coreografías medidas con el reloj del juego: quien recibe el mimo espera a que el otro llegue.
- Ropa: `personajes/blender/ropa.py` (y `ropa_arriba`, `ropa_abajo`, `ropa_pies`, `ropa_pelo`,
  `ropa_accesorios`) arma cada prenda sobre el personaje construido y la pesa a sus mismos huesos; se exporta un GLB
  por prenda y personaje (`public/modelos/ropa/`), con íconos por color. En el juego se une al esqueleto del
  personaje, se esconde la ropa de fábrica que tapa y se pinta según el color comprado (`src/casa/ropa.ts`).
  Regenerar: `python3 ropa.py <juego/web/modelos-crudos> el|ella [claves]` y luego `npm run optimizar`.
- Modo local (sin internet, o dos pestañas del mismo navegador) con la misma interfaz que el modo en línea.
