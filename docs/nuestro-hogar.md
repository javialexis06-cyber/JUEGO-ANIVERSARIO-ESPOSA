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

Se cambia de cuarto con las pestañas de abajo; cada pestaña muestra la carita de quién está ahí.
Tocar el piso hace caminar a tu personaje; tocar al otro abre sus mimos; tocar la nevera abre las notas.

## Necesidades

Comida, energía, higiene y cariño (0 a 100). Bajan con el reloj real, **también con la app cerrada**
(por hora: comida 8, energía 6, higiene 4, cariño 5; dormido la comida y la higiene bajan a la mitad y la energía sube 16).

- La cara muestra el ánimo (la necesidad más baja): feliz ≥ 60, normal ≥ 30, triste por debajo (cara y pose tristes).
- Con poca higiene aparece barro en la cara y la ropa (3 niveles).
- Si algo está por debajo de 30, sale un globo de pensamiento con lo que necesita.
- Despierta solo cuando la energía llega a 100 (o con el botón Despertar).

## Mimos con la pareja

| Mimo | Tu cariño | Su cariño | Primer mimo del día |
|---|---|---|---|
| Caricia | +4 | +10 | +5 monedas |
| Abrazo | +15 | +15 | +8 monedas |
| Beso | +20 | +20 | +10 monedas |

Tu personaje camina hasta el otro (aunque esté en otro cuarto), se ponen de perfil y posan juntos, con corazones.
Si el otro está dormido, sonríe entre sueños. También se puede **llevarle comida** (sube su comida), **saludar** y
**dejar notas** en la nevera (se ven pegadas en la puerta).

## Regalos

Se compran en la tienda y se entregan con un mensaje. A quien lo recibe le aparece una cajita junto a su personaje;
al abrirla ve el regalo, el mensaje y sube su cariño.

| Regalo | Precio | Cariño | Extra |
|---|---|---|---|
| Carta de amor | 5 | +15 | |
| Cajita sorpresa | 15 | +20 | trae una comida al azar |
| Chocolates | 20 | +25 | +8 comida |
| Ramo de flores | 25 | +30 | |
| Osito de peluche | 40 | +40 | se queda para decorar |

## Mensajes de voz (como una llamada)

- En la hoja de la pareja: «Mensaje de voz». Se graba hasta 30 segundos (con onda y reloj), se puede oír y repetir,
  y enviarlo cuesta 15 monedas de la casa.
- A quien lo recibe le suena el teléfono (timbre y vibración) con la carita de quien llama: «Contestar» o «Después».
  Al contestar suena el mensaje; al terminar puede oírlo otra vez o «Responder» con otro mensaje.
- Oír un mensaje nuevo sube 20 de cariño. Si llegó mientras la app estaba cerrada, aparece el botón «Mensaje de voz».
- Todos quedan en el menú → «Buzón de voz». En línea el audio va a la carpeta privada de la casa en Supabase
  (la misma de las fotos, no hay que correr nada nuevo); sin internet quedan en el celular (los últimos 6).

## Monedas (de los dos)

- Bono del día: +20 para cada uno al abrir la app.
- Primeros mimos del día (tabla de arriba) y +50 el día del aniversario.
- **Sueldo del súper**: un tercio de la ganancia de cada día jugado en Súper Manía.

Se gastan en comida (3 a 18), regalos (5 a 40), decoración (20 a 45), ropa (15 a 90), tintes (20) y disfraces.

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
