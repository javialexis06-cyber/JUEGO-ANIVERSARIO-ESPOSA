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

Se cambia de cuarto con las pestañas de abajo; cada pestaña muestra la carita de quién está ahí. Tu personaje va
contigo: camina hasta la puerta del cuarto donde está (la cámara lo espera un momento), sale y entra caminando por
la puerta del otro cuarto. El de tu pareja se queda donde está (lo que se ve es su estado). Dormido no se levanta:
la pestaña solo muestra el cuarto.

Tocar el piso hace caminar a tu personaje hasta ahí; tocar al otro abre su hoja; tocar la nevera abre las notas.
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
