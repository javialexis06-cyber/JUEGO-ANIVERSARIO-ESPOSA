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
| Baño | Bañarse (en la tina con burbujas) · Lavarse la cara en el espejo (minijuego) | higiene al 100 · según cómo le vaya |
| Cuarto | Dormir (acostado en la cama) · Cambiarse en el clóset | +16 energía por hora dormido · +12 higiene |

Se cambia de cuarto con las pestañas de abajo (solo los cuartos construidos; si no caben, se desplazan de lado) o
con el **plano** (la casita amarilla al principio de las pestañas): la casa vista desde arriba, tres pisos de a tres
cuartos, con la carita de quién está en cada uno. Cada pestaña muestra la carita de quién está ahí. Tu personaje va
contigo: camina hasta la puerta del cuarto donde está (la cámara lo espera hasta que cruza la puerta; no cambia de
cuarto a mitad de camino), sale y entra caminando por la puerta del otro cuarto. El de tu pareja se queda donde está (lo que se ve es su estado). Dormido no se levanta:
la pestaña solo muestra el cuarto.

Tocar el piso hace caminar a tu personaje hasta ahí; tocar al otro abre su hoja; tocar la nevera abre las notas.
**La casa siempre en línea:** hasta dónde caminó cada uno queda en su estado (`actividad.pos`), así en el celular
del otro se le ve caminar hasta el mismo sitio (y al abrir la app ya está parado ahí). Al volver a la app, si el
canal en vivo se cayó mientras el celular dormía, se vuelve a abrir solo.
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
| Juegos | gratis (viene con la casa) | Los **minijuegos ya no están en el menú**: arcade de Súper Manía (con la pantalla prendida), la **puerta 100** morada de Cien Puertas la mesa con el parchís servido (dos pufs) y el botón **⚔️ Sangre y Ceniza** (el survivors oscuro de hasta 4, ver `docs/sangre-y-ceniza.md`; el personaje camina al arcade). El personaje camina al arcade, a la puerta o se sienta en el puf, y de ahí se entra al juego. También un retrete espacial en miniatura (se sientan en él y sale quién ha volado más lejos) y el botón **Tienda del retrete**. Los minijuegos **secretos** (retrete espacial, lavarse la cara) se descubren solos con lo que les pasa; ya descubierto, el retrete en miniatura también trae **🚀 Volar en el retrete** |
| Trofeos | 50 | Seis pedestales de mármol con los trofeos de cada minijuego y su **placa con el título** encima, el **cuadro de honor** con el título de cada uno en cada juego, la vitrina con los trofeos chiquitos de cada uno, alfombra roja y el podio de la **copa del amor**. «Admirar»: aplaude frente al mejor trofeo |
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
| Retrete espacial | 500 | 2000 | 5000 metros de vuelo | `casa.cohete[rol].mejor` (los récords viejos en segundos de `casa.retrete` se pasan a metros: 15 s → 500, 45 s → 2000, 90 s → 5000) |
| Lavarse la cara | 10 | 20 | 30 minutos aguantados (lo mejor en cualquier escenario) | `casa.lavadoProgreso[rol].mejor` |
| Cocina de chef | rango 3 | rango 6 | rango 9 (el mejor de los tres restaurantes) | `casa.cocina` |

Al abrir la app, lo de cada celular sube a la casa (`casa.logros`, se guarda el máximo). Cada metal nuevo paga una
vez 5, 10 o 20 monedas; la **copa del amor** es del metal del trofeo más bajito (paga el triple). En la sala se ven
en sus pedestales dando vueltas despacito (sin ganar: una silueta clarita).

**Títulos.** Cada uno tiene un título en cada juego según su metal (el de la pareja es el de lo mejor de los dos);
el de la cocina es su rango de chef y la copa del amor da el de la pareja:

| Juego | Sin ganar | Bronce | Plata | Oro |
|---|---|---|---|---|
| Súper Manía | En práctica | Estrella de la caja | Gerente del barrio | Leyenda del súper |
| Cien Puertas | Curiosidad pura | Alma exploradora | Mente cerrajera | Leyenda de las 100 puertas |
| Juegos de mesa | Aprendiz de la mesa | Rival de cuidado | Mente estratega | Leyenda de la mesa |
| Retrete espacial | Astronauta en pañales | Piloto del retrete | Comandante espacial | Leyenda galáctica |
| Lavarse la cara | Carita sucia | Carita limpia | Terror de los gérmenes | Piel de porcelana |
| Cocina de chef | Aprendiz… | (el rango: Cocinero de casa, Chef de la cuadra…) | | Leyenda de la cocina |
| Copa del amor | Pareja en práctica | Pareja que brilla | Pareja de campeones | Pareja legendaria |

Quien todavía no ha jugado sale «Sin estrenar». La sala (`src/casa/sala_trofeos.ts`) corre los cuatro pedestales
del modelo y copia dos más (burbujas para lavarse la cara, gorro de chef para la cocina); encima de cada uno va una
placa con el nombre del juego, el título de la pareja y sus medallas; en la pared de la izquierda, el **cuadro de
honor** con el título y el récord de Ella y de Él en cada juego; y en la vitrina, los trofeos chiquitos que cada uno
se ha ganado (arriba los de Ella, abajo los de Él). Los dos cuadros que se pueden poner pasaron a la pared de la
izquierda. Tocar el cuadro, una placa o la vitrina abre la hoja de trofeos, donde se lee todo en grande.

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

- **Ir al baño** (en el baño): se sienta en el inodoro y pone caras exageradas mientras piensa cosas. Cada
  visita arma su propia rutina (llega, puja, piensa, se entretiene, algo raro, se queja, gana) con un banco de
  **más de 200 frases** («¿Los peces tienen sed?», «Tres memes y me paro. Bueno, cinco», «Descarga completada ✅»,
  y unas propias de Él y de Ella), escogidas con el momento en que se sentó: los dos celulares ven lo mismo.
  Las frases traen la forma de Él y la de Ella («liviano|liviana»). Código: `src/casa/bano_frases.ts`.
- **Eventos graciosos (10 % de las veces)**, 20 distintos: se tapó el inodoro (el agua se riega por el piso),
  entra un **ratón** o **cucarachas** (una vuela) y sale corriendo a subirse a la bañera, se acaba el papel,
  se va la luz (el baño a oscuras), una araña baja del techo frente a su cara, una mosca, un concierto en el
  baño, se queda dormido(a), lo(a) llama la mamá, el chorro del inodoro, se le duermen las piernas, el eco,
  una lagartija (a la que le pone nombre), se queda encerrado(a), el patito de hule que lo(a) mira, sin wifi,
  el ambientador y un ruido de fantasma. Los bichos son figuritas 3D (`src/casa/bichos.ts`).
- En 7 de ellos **llama a la pareja** («¡AMOOOR! ¡HAY UN RATÓN!»): a la pareja le sale «¡Auxilio!» con el
  botón **¡Voy corriendo!**; su personaje llega al baño, espanta el bicho (o destapa, o trae el papel), y quien
  estaba en apuros sale feliz («¡Mi héroe!») con cariño para los dos.
- **Lo que les cae pesado**: a Ella la leche (vaso de leche, yogur, arroz con leche) y a Él el picante
  (empanada con ají, tacos), comido por uno mismo o llevado por la pareja. Le sale un globito con un
  inodoro que tiembla y el botón «Ir al baño» se pone en rojo.
- **Solo la primera vez hace falta la leche o el picante** (así se descubre el secreto; queda anotado en
  `casa.coheteVisto[rol]`, y quien ya tenga récord, vuelos o compras del retrete cuenta como descubierto). De ahí en
  adelante, **cada vez que se sienta en el inodoro** («Ir al baño» o tocando el inodoro) sale el botón principal
  **🚀 Volar en el retrete** (además de lo normal del baño; se va cuando se para): despegue corto («¡3, 2, 1…
  DESPEGUE!») y a jugar. Lo mismo en el **retrete en miniatura del cuarto de juegos** (en la hoja del marcador):
  camina al retrete, despega desde ahí y al volver aterriza en el cuarto de juegos. Con las ganas de verdad
  (leche o picante) sigue despegando solo, con el susto completo.
- Con esas ganas, en el inodoro todo tiembla, echa humo y **sale disparado por el techo al espacio** (el
  personaje de verdad, vestido como está y con su casco, sentado en el retrete que tenga puesto, con llama de
  cohete y su estela). Se arrastra el dedo en cualquier parte para esquivar; el juego va a 30 cuadros por
  segundo y baja la resolución y las partículas solo si el celular no da. Mientras vuela dice cosas («Siempre supe
  que algún día saldría como un cohete del baño», «Esto está más lleno que el metro de Medellín en hora pico»…).

### El vuelo (estilo Jetpack Joyride)

- **Lo que tumba se ve rojo y lo bueno dorado**: asteroides, meteoritos, satélites, basura, inodoros viejos, latas,
  chanclas, pájaros, aviones, ovnis, cometas y agujeros negros llevan el **borde encendido en rojo** (en el mismo
  material, con un latido) y un **brillo rojo que abraza cada círculo de choque** (así se ve exactamente lo que
  tumba: las alas del satélite, el avión entero). El rayo del ovni, su franja de aviso y los «!» del borde también
  son rojos. Los **rollitos** tienen un resplandor dorado y los **poderes** un aro dorado que gira con destellos.
  Las piedritas del fondo y los pedazos de lo que explota no brillan: no hacen nada. Todos los brillos de cada tipo
  se pintan de una sola vez (instancias): no le pesan al celular (`src/casa/cohete/resaltar.ts`).
- **Arranque tranquilo**: los primeros ~25 s el mundo va al 60 % de la velocidad (sube suave hasta la normal a los
  30 s), los obstáculos salen más separados, las bandadas son de 2 a 4 pájaros y los aviones esperan a que pase el
  arranque. De ahí la velocidad sigue subiendo de a poquito con la distancia, como antes.
- **Tramos**, cada uno con su cielo, luz, planeta y música (sintetizada, bajita): el cielo del barrio (nubes de
  algodón, pájaros, aviones con aviso y **la chancla voladora de la mamá**), la órbita (la Tierra abajo girando,
  satélites, inodoros viejos, latas), la Luna (rocas con cráteres, ovnis que siguen al retrete y disparan un rayo
  avisado con una franja), Marte (cometas con aviso «!» en el borde y **lluvias de meteoritos**), el cinturón de
  asteroides (campos de piedritas, muros con hueco, **agujeros negros** que jalan), la nebulosa y la galaxia del
  amor (todo rosado, con más corazones de rollitos). Al pasar de uno al otro sale el letrero del tramo.
- **Rollitos de papel dorados** en hileras y figuras: corazones (vacíos y llenos), «ÉL ♥ ELLA», «TE AMO», «TQM»,
  flechas, olas, estrellas, una carita, un retrete… Recoger una figura completa da +10. Son la moneda de la tienda
  del retrete (no de la casa).
- **Poderes** que salen en su burbuja con el ícono 3D brillando (más seguido con la mejora de suerte): **burbuja de
  jabón** (aguanta un golpe), **imán de rollitos**, **turbo de frijoles** (velocidad loca, invencible, revienta lo
  que toque y deja nube verde), **cámara lenta**, **puntaje doble** (×2 flotando), y los que se desbloquean en la
  tienda: **desatascador láser** (cañón que dispara solo), **mini-retrete ayudante** (vuela recogiendo rollitos),
  **pastilla encogedora**, **ambientador de lavanda** (vuelve flores todo lo que hay en pantalla) y **paca de 12
  rollos** (lluvia de rollitos). Los activos se ven abajo a la izquierda con su reloj.
- Distancia en metros, puntaje (metros + rollitos + «¡por un pelito!» + lo destruido) por el **multiplicador** de
  misiones. En el camino salen las banderitas de **tu récord** y del **récord de la pareja** («¡Te pasé, mi amor!»).
- Pausa con el botón, y sola si la app se va a segundo plano (`src/segundo_plano.ts`).
- Al chocar (o al revivir con la mejora) explota, cae con un **paracaídas de papel higiénico** y sale la pantalla
  del vuelo: distancia, rollitos, puntaje, récords, las tres misiones con su barrita y, si se cumplieron, el nivel
  nuevo con su cofre. De ahí, **🚀 Volar otra vez** (el vuelo vuelve a empezar ahí mismo, sin pasar por la casa:
  se reusan los modelos, las partículas y el mismo lienzo 3D, así que repetir no gasta más memoria), **Tienda** o
  **Volver a casa** (aterriza en el baño, o en el cuarto de juegos, con el ¡KABOOM!).
- Premio para la casa: igual de escaso que antes (1 moneda cada 15 s, hasta 3 por vuelo), pero se da **apenas
  aterriza cada vuelo** (la pantalla dice «+N monedas para la casa») y con **tope de 6 por persona al día**
  (`casa.diario["AAAA-MM-DD|rol|retrete"]`); pasado el tope la pantalla lo avisa y los rollitos siguen. Los
  rollitos son para su tienda.

### Misiones y multiplicador

Tres misiones a la vez (recoger rollitos en un vuelo o en total, volar tantos metros, esquivar por un pelito, usar
turbos, agarrar poderes, destapar asteroides con el láser, esquivar cometas y chanclas, llegar a un tramo, figuras
completas, un corazón entero, tumbar ovnis, sobrevivir lluvias, escapar de agujeros negros, comprar en la tienda…).
Cada una paga rollitos; con las tres se sube de nivel: **el multiplicador del puntaje sube a ×(nivel + 1)** y llega
un cofre. Las metas crecen con el nivel (hasta el 30).

### Tienda del retrete

Se abre al terminar el vuelo y desde el cuarto de juegos (botón «Tienda del retrete» o tocando el retrete en
miniatura: sale el marcador y el botón). A la izquierda, el personaje en su retrete dando vueltas: lo que se toca se
**prueba encima** antes de comprarlo.

| Pestaña | Qué hay |
|---|---|
| Mejoras | Duración de cada poder (5 niveles; láser, ayudante y pastilla se desbloquean con el primero), ambientador y paca (desbloquear), imán más fuerte, burbuja de arranque, **segunda oportunidad** (revivir 1 vez, con burbuja, o 2 veces), **arranque con frijoles** (300/600/1000 m de turbo), poderes más seguidos, **papel triple hoja** (+15/30/50 % rollitos) y **taza aerodinámica** (el retrete ocupa menos). Precios de 100 a 3200 por nivel |
| Retretes | Porcelana de la casa (con forro peludo), letrina de finca (con tusa), baño portátil de concierto, retrete chiva (parrilla, plátanos y gallina), nave espacial, princesa, gamer RGB (luces que cambian), trono dorado y oro con diamantes (300 a 3500) |
| Estelas | Fuego, nube de frijoles, burbujas, corazones, chispitas, notas de cumbia, confeti tricolor, pétalos, arcoíris y estrellitas (250 a 1100) |
| Cascos | Desatascador en la frente, gorro de baño con patitos, sombrero de rollo, antenas de marciano, gorro de aviador, casco vikingo, casco de astronauta y corona galáctica (250 a 1600), hechos sobre la cabeza de Él y de Ella |
| Misiones | Las tres misiones, el nivel y los números de cada uno |

Balance con el piloto automático (48 vuelos sin mejoras): mitad de los vuelos pasan de 40 s y 600 m (uno de cada
cuatro pasa de 1000 m; antes del arranque tranquilo, uno de cada tres se caía antes de 20 s, ahora uno de cada
cinco). Con mejoras de nivel medio (burbuja, segunda oportunidad, arranque, imán, turbo, suerte) la mitad pasa de
1300 m; con buenas compras se pasa de 2000 m.

### Datos y código

- `casa.cohete[rol]` (`ProgresoCohete`, normalizado en `src/casa/cohete/datos.ts`): rollitos, mejoras, cosméticos
  comprados y puestos, nivel y misiones, mejor distancia y puntaje, vuelos. Se guarda al terminar cada vuelo y en
  cada compra. `casa.coheteVisto[rol]`: cuándo lo descubrió (`yaDescubrio()` en `cohete/datos.ts`).
- Código: `src/casa/cohete.ts` (el juego, `otraVez()` para volver a volar) y `src/casa/cohete/` (datos y catálogos,
  escenario y tramos, obstáculos, poderes, rollitos y figuras, partículas, efectos, música, tienda, pantalla del
  vuelo, `resaltar.ts` con el rojo y el dorado). En `main.ts`: `irAlBano()` (la primera vez), `volarEnRetrete()`
  (el botón 🚀 del inodoro y del retrete en miniatura), `volarCohete()`, `premioVuelo()` (monedas con tope),
  `abrirTiendaRetrete()` y `terminarCohete()`.
- Modelos: `personajes/blender/cohete_piezas.py` (retretes, poderes, rollito, basura espacial, ovni, avión, pájaro,
  ayudante e íconos), exportados con `blender -b -P cohete_exportar.py -- juego/web/modelos-crudos` a
  `cohete_retretes.glb` y `cohete_cosas.glb`; los cascos con `cohete_cascos.py` (maquinaria de la ropa) a
  `ropa/cohete_<casco>_<rol>.glb`. Se optimizan con `gltf-transform optimize … --compress meshopt` (no con `npm run
  optimizar`, que reescribe el catálogo de ropa) y los íconos pasan a `iconos/cohete_*.webp`. Los asteroides, los
  planetas, las nebulosas y las nubes se pintan en el juego.
- Pruebas: `__volar()` (vuela sin ir al baño), `__tiendaRetrete()`, y durante el vuelo `__cohete.manual()`,
  `.simular(seg)`, `.bot()`, `.dios()`, `.dar(n)`, `.saltar(m)`, `.poder(id)`, `.mejoras({...})`, `.estado()`.

### Los amigos, sin la casa (`retrete.html`)

- Desde su sala de juegos un amigo abre **`retrete.html`** (o `retrete.html?tienda` para solo la tienda): despega de
  una, sin pasar por la casa, con **su muñeco y sus colores** (el de Javier o el de Laura como base, teñido con
  `teñirModelo` de `src/salas/tinte.ts`; los cascos se ponen sobre ese muñeco). Volar otra vez, la tienda, las
  misiones y la pausa funcionan igual. Su progreso va en el aparato (`amigo-retrete-progreso`) y al salir («🎮 Mis
  juegos» o atrás) vuelve a `./amigos.html`. Si el aparato no está en modo amigo, la página manda a la casa: Javier y
  Laura lo juegan desde el baño, con su progreso de verdad.
- **Modo neutro** (opción `amigo` de `jugarCohete`): frases propias sin la leche ni el picante, sin apodos, recuerdos
  ni «liviano|liviana»; sin banderitas ni récord de la pareja («¡Te pasé, mi amor!», «Le ganaste a…»); las figuras
  de rollitos «ÉL ♥ ELLA», «TE AMO» y «TQM» salen como «WOW», «GOL» y «TOP»; la galaxia del amor se llama **la
  galaxia de chicle**; las estelas de corazones y pétalos tienen otra descripción; no hay monedas de la casa.
  `textosDeLaPareja()` (en `cohete.ts`) dice todo lo que el modo neutro esconde, para las pruebas.
- Prueba: `node scripts/probar-amigos-juegos.mjs <url>` (ver la cocina).

## Lavarse la cara (minijuego secreto: un Vampire Survivors completo)

**Cómo se entra.** En el baño, **Lavarse** (o tocar el lavamanos): camina al espejo, se mira («¿Y esos
granitos?»), la cámara se acerca, la casa se pone borrosa y la cara del espejo se deshace en ondas de agua hasta
que se entra a su propia cara. Mientras se juega, la casa y las ondas se esconden y se detienen (no gastan
batería). Si el celular se va al fondo, se abre la pausa y el juego deja de dibujar.

**El menú** (`src/casa/lavado/menu.ts`): «¡A lavarse!», «Jugar con Javier/Laura», «👥 Con amigos» y «🔑 Unirme con
código» (salas de hasta 4), disfraces, escenarios, cartas de amor, el ataque (🎯 solito o a mano), la tienda de
poderes, la colección (armas, pasivas, bestiario y logros) y «🎓 Cómo se juega».

**Tutorial** (`tutorial.ts`): la primera vez que se toca «¡A lavarse!» (y cuando se quiera, desde «Cómo se juega») se
juega una partidita guiada sin oleadas y sin caerse: caminar, las armas que disparan solas, recoger gotitas, subir de
nivel, los cofres, la evolución (le deja un arma al máximo con su pasiva y un cofre) y apuntar a mano. Cada paso
espera a que se haga; se puede saltar. Queda marcado en el progreso (`tutorial`).

**Ataque solito o a mano**: con «a mano», en el celular se camina con un dedo en la mitad izquierda y se apunta con
otro en la mitad derecha (joystick dorado); en el computador, las armas apuntan al mouse. Apuntan a mano la toalla, la
varita, el cepillo, el champú, la peinilla, el secador, el jabón y el perfume/colonia (mira de puntitos en el piso).
Los **disfraces de área** (perrito, bombero, astronauta, barbero, bata y turbante, sirena, princesa, ranita) siempre
disparan solitos. Se cambia en el menú, en la sala de espera o en la pausa, y se guarda (`manual`).

**La partida** (motor en `src/casa/lavado/motor.ts`, todo como el original):
- **30 minutos**; al llegar, «¡Se acabó el agua caliente!» y sale la **Ducha Helada** (la Parca: no se le gana).
  Pausa, retirarse y cobrar, y **modo Apurado** (todo más rápido; se abre ganando La Cara).
- **Oleadas minuto a minuto** (mínimo de bichos, cada cuánto llegan y qué tipos), enjambres que cruzan, anillos,
  muros, élites (con cofre) y **jefes con cofre** cada 5 minutos. Después del minuto 14 los bichos aguantan y
  pegan un poquito más cada minuto (sin la tienda no se llega a 30).
- **38 bichos de arcilla y felpa** renderizados en Blender (`personajes/blender/lavado_bichos.py`): gérmenes,
  puntos negros, gotas de grasa, ácaros, granitos, caspa, bacterias, pelusas, virus, barritos, lagañas, mugre,
  mocos, sarro, pasta seca, hongos, cucarachas, pelos, moho, jabón sucio, piojos, zancudos, pulgas, burbujas
  sucias, babosas, espinillas… y los jefes: el Espinillón, la Reina Caspa, el Gran Moco, Don Lagaña, el Barro
  Negro, el Señor Sarro, Doña Cucaracha, la Mota de Pelo, el Tapón, la Esponja Podrida y el Pelo del Desagüe.
- **Experiencia como el original** (5 al nivel 2, +10 hasta el 20, +13 hasta el 40, +16 después, con los saltos
  del 20 y el 40). Gotitas azules, verdes y rojas; las que sobran se juntan en una gotota roja.
- **Subir de nivel**: 3 cartas (4 con suerte), **volver a tirar, saltar y vetar**. Las capas (cartas, cofre, carta de
  amor) se abren y se cierran solas según lo que diga el motor: cada toque lleva el número de acciones del jugador
  (`Jugador.acciones`), así un toque viejo o un doble toque no escoge a ciegas la carta de la subida siguiente, y en
  pareja el invitado repite lo que escogió (por si la red se lo come) sin que cuente dos veces. Las cartas no
  aceptan toques en sus primeras décimas (mientras entran). 6 armas (8 niveles) y 6 pasivas
  (5 niveles). **19 armas** (toalla mojada = látigo, varita de burbujas = varita mágica, cepillo de dientes =
  cuchillos, champú volador = hacha, peinilla bumerán = cruz, esponjas orbitales = biblia, secador = fuego,
  aura de espuma = ajo, botellitas de agua = agua bendita, jabón resbaloso = runetracer, bombillo travieso =
  relámpago, toallita desmaquillante, paticos de hule = pájaros, ranitas, chorro de la ducha, hilo dental,
  perfume y colonia…) con **evoluciones** (arma al máximo + su pasiva + cofre después del minuto 10) y **uniones**
  (paticos amarillo + morado, perfume + colonia). **16 pasivas** (jabón extra fuerte, gorro de baño, crema, crema
  de noche, reloj de arena, lupa, liga del pelo, sales de baño, espejo doble, pantuflas, imán, trébol, corona,
  alcancía, espejo roto y curita de corazón).
- **Cofres** con la tragamonedas de 1, 3 o 5 premios. En el piso: arepa con queso (vida), ola de agua fría
  (limpia la pantalla), hielo (congela), aspiradora (todas las gotitas), monedas y bolsas de gotas doradas,
  trébol, ají y velitas que se rompen.
- **Cartas de amor** (los arcanos): 18 recuerdos reales de los dos (Transformice, las videollamadas de 24 horas,
  el 25 de octubre, Cartagena, las luces de diciembre, la propuesta…). Se escoge una al empezar y salen otras en
  los minutos 11 y 21.
- **Pantalla final** con el daño y el DPS de cada arma, y los logros nuevos.

**Gotas doradas y tienda de poderes** (`tienda.ts`): 19 poderes como los del original (vida, recuperación,
armadura, velocidad, poder, área, duración, cantidad, recarga, suerte, crecimiento, codicia, maldición, imán,
revivir, volver a tirar, saltar, vetar); cada compra sube el precio de todo y se puede pedir el reembolso.

**Disfraces** (en vez de personajes, `disfraces.ts`): 8 de Él (panda en pijama, perro lanudo, dentista del
barrio, Súper Jabón, leñador del champú, astronauta del retrete, bombero de la ducha, barbero de vueltiao) y 8 de
Ella (pulga aventurera, la mejor guerrera de Dios, directora Yanbal, bata y turbante, sirena de la bañera, ranita,
princesa del spa, estilista del secador). Cada uno trae su arma y su bono, ropa del clóset y accesorios del baño
(`public/modelos/lavado/accesorios.glb`), y se abre con un logro o con gotas doradas. Al empezar dice su habilidad
(`grito`) y avisa cuando crece al subir de nivel (`alCrecer`), solo en el celular de quien la tiene.
- Piezas propias de los disfraces (en `personajes/blender/lavado_objetos.py`, las de la cara y el pelo modeladas ya
  en su sitio con `H()`): antifaz rojo del Súper Jabón, bigote frondoso del leñador y de manubrio del barbero,
  corona de la guerrera, rulos de la estilista y toalla mojada del panda. Lo de la mano va grande (si no, en el
  juego no se ve).
- La ropa del clóset se retoca por disfraz sin tocar el clóset: `ajustes` (correr o agrandar una prenda en la pose
  de amarre, como el vueltiao que flotaba) y `sinPelo` (los cascos y gorros esconden el pelo que se salía).
- Exportar: `blender -b -P personajes/blender/lavado_objetos.py -- accesorios /tmp/accesorios.glb` y
  `npx gltf-transform optimize /tmp/accesorios.glb public/modelos/lavado/accesorios.glb --compress meshopt
  --simplify-ratio 0.15 --simplify-error 0.002 --join false --instance false --flatten false` (sin `--join false`
  se pierden los nombres de los accesorios). Retratos: `node scripts/generar-sprites-lavado.mjs` (con el servidor
  prendido; `PUERTO=…`).

**Escenarios**: **La Cara** (piel con poros, pequitas y cachetes), **El Lavamanos** (un pasillo de porcelana
con paredes de baldosín: menos bichos a la vez pero sin salida arriba ni abajo; se abre aguantando 15 min en La
Cara) y **La Bañera** (agua con cáusticas, espuma y paticos; se abre aguantando 15 min en El Lavamanos).

**De 2 a 4: pareja y amigos** (`linea.ts`, `juego.ts`, sobre las salas de `src/salas/`, ver `docs/salas.md`): Javier
o Laura invitan desde el menú (abre una sala y la invitación con el código le llega a la casa del otro: «¡A lavarse
la cara juntos!»; entra desde su espejo), o cualquiera abre una sala «Con amigos» y los demás entran con el código.
En la **sala de espera** cada uno escoge disfraz y ataque y toca «Estoy listo»; el anfitrión empieza (se juega en
**su** cara: si es un amigo, con su tono de piel). El anfitrión simula y manda **una sola foto** cada 100 ms para
todos (lo que ve cualquiera, anclado al jugador que lo ve); cada uno mueve su personaje al instante (predicción) y
le cuenta al anfitrión dónde está y hacia dónde apunta. La experiencia es compartida, cada uno escoge sus cartas y
tiene su inventario; mientras alguien escoge, el juego espera, pero **cada quien tiene 15 s** (9 en el cofre): si se
demora, se le escoge lo que escogería el bot, y los demás ven quién está escogiendo con su cuenta regresiva.
- **Dificultad por jugador** (`POR_JUGADORES` en `motor.ts`): mugrosos a la vez ×1 / 1,4 / 1,75 / 2,05; vida ×1 / 1 /
  1,15 / 1,3; jefes ×1 / 1 / 1,3 / 1,6; eventos ×1 / 1,3 / 1,55 / 1,8; élites extra con cofre cada 150 / 95 / 70 s
  (pareja / tres / cuatro); con tres o cuatro hace falta 30 / 50 % más experiencia por nivel (para no pausar a cada
  rato). En pareja queda como estaba, salvo el élite extra.
- **Premios repartidos**: el cofre de cada jefe sale **uno para cada jugador** (brilla con su color y solo lo coge su
  dueño); las gotas doradas son de quien las recoge + la cuarta parte de las de los demás.
- Cualquiera **levanta** a quien caiga quedándose a su lado (dos al lado, más rápido). Cada uno tiene su color
  (anillo en el piso, chip con su vida arriba a la derecha, su nombre encima y una flecha de su color cuando no se ve).
- **Cortes**: si alguien se queda sin conexión (o se va a segundo plano), todos quedan en pausa con aviso; a los 20 s
  se sigue sin él, y apenas vuelve entra de una al lado de alguien. Si un invitado se retira, los demás siguen; si el
  anfitrión termina o se va, se acaba para todos con aviso. Al final, «Volver a la sala» los deja otra vez en la sala
  de espera. En la casa local de prueba (sin internet) las salas van entre pestañas (`?red=mala` simula pérdidas).
- **Modo neutro** (`textos.ts`): si juega un amigo o hay amigos en la sala, nada personal: las cartas de amor son
  **cartas mágicas** (mismos efectos, nombres y frases sin recuerdos), los disfraces con apodos o recuerdos cambian de
  nombre (Osito en pijama, Perrito peludo, Pulguita saltarina, Guerrera del escudo, Diva del perfume…), sin «¡Levántate,
  mi amor!» ni corazones, y los logros nombran lo neutro. Los amigos se ven con su cuerpo y sus colores.
- La ducha (Chorro de la ducha y Diluvio) es mucho más transparente: una franja clarita y hilos de agua con brillitos
  que no tapan a nadie.
- Pruebas: `node scripts/probar-lavado-salas.mjs <url>` (Javier, Laura y dos amigos en cuatro celulares con un
  Supabase de mentiras: sala, caminar, cartas, escoger solo, carta mágica, cortes corto y largo, caída y levantada,
  final, volver a la sala, el anfitrión que se va, y que nadie vea nada personal) y `node scripts/probar-amigos.mjs`.
  (La prueba vieja de pareja, `probar-lavado-linea.mjs`, quedó por fuera: era del canal de dos que ya no existe.)

**Gráficos y rendimiento** (`dibujo/`): three.js con cámara ortográfica inclinada; Él y Ella en 3D con su
disfraz; los bichos, objetos y efectos son lotes de sprites con instancias (cientos a 30 cuadros), con destellos
al golpear, sombras, números de daño chiquitos, charcos y partículas. Rejilla espacial, nada se crea en cada
cuadro, calidad que baja sola, `forceContextLoss()` al salir. Música propia que se anima con los minutos y los
jefes (`sonidos.ts`).

**Premios en la casa**: higiene al 100 si aguantó 5 minutos (si no, según lo que aguantó); monedas de la casa
escasas: 1 cada 2 minutos aguantados, +3 si llega a los 30 (máximo 15 por partida). El progreso de cada uno
(gotas doradas, tienda, disfraces, logros, colección, récords) se guarda en la casa en `casa.lavadoProgreso[rol]`
(normalizado en `modelo.ts`) y el récord de bichos en `casa.lavado`. El trofeo cuenta los **minutos
aguantados** (10, 20 y 30).

**Pruebas**: `node scripts/balance-lavado.mjs [partidas] [escenario] [disfraces] [nada,media,toda]` (partidas
enteras con el bot en Node); `node scripts/probar-lavado-nivel.mjs <url>` (celular táctil emulado con toques de
verdad: 20 subidas de nivel seguidas, colas de niveles con dobles toques, volver a tirar, vetar, saltar, cofres,
cartas de amor, pausa y segundo plano, retirarse, «Otra lavada», el menú y volver a la casa; y lo básico con el
mouse); en el navegador, `?botlavado` pone el bot a jugar y `window.__lavado.actual.probar(…)` (`tiempo`, `xp`,
`subir`, `cofre`, `aguante`, `arma`, `caer`, `juntar`, `fin`, `bot`); `?sin3d` cambia los muñecos por burbujitas
(para los navegadores de prueba).

## La cocina de chef (tres minijuegos estilo Papa's)

- En la cocina, **Cocinar** (o tocar el mesón/la estufa) abre los tres restaurantes: **La Waflería**, **La
  Fresería** y **La Frapería** (cada uno con su propio progreso, por persona). El personaje camina a la estufa,
  se soba las manos, se concentra (cara de concentrado) y la cámara se le acerca; entonces sale el **«MODO
  CHEF»**: fondo oscuro con líneas de velocidad que giran, el chef (Él o Ella con gorro y chaqueta de chef,
  sacado del modelo 3D) acercándose con destellos en los ojos, y la cocina se vuelve un restaurante
  profesional (azulejos, acero, campana extractora). La otra persona lo ve en la estufa, concentrado.
- Se juega como Papa's: en **Pedidos** llegan invitados al mostrador —familia, vecinos y amigos: la Abuela
  Rosa, la Tía Marta, el Primo Santi, Vale la del gym, la Sobrinita Luci, Doña Rubi, Pacho el del colegio, el
  vecino misterioso, Don Jairo el portero, Nelly, Don Hernán (apurado) y **el crítico famoso** (exigente, cada
  5 días), sacados de los muñecos del súper con las poses de Él y Ella— y **la pareja** llega a comer cada
  3 días (paciente, con corazones, doble propina y frases de amor). Se toca «Tomar pedido», el tiquete se
  escribe y queda colgado en el riel de arriba; se escoge un tiquete y se cocina en las estaciones de abajo.
  Al entregar, el invitado califica **Espera** y cada estación (barras), da el total y la propina, y
  reacciona (encantado, contento, así-así o bravo con vapor 💢).
- **Waflería**: *Plancha* (jarras de masa: clásica, chocolate, red velvet, avena; se sirve en las
  waffleras, se voltea cuando la flecha llega a la rayita **D**oradito o **T**ostadito y se saca a la
  rejilla; si se pasa, humo y se quema), *Armar* (los wafles al plato y los toppings: mantequilla, miel,
  arequipe, chocolate, leche condensada se **chorrean** arrastrando; chispitas y azúcar glas se
  **espolvorean**; fresas, banano, arándanos, crema chantilly, helado, masmelos y kiwi se **ponen donde dice
  el dibujito** del tiquete) y desde el rango 3 *Bebidas* (vaso P/M/G, jugo de naranja, mora, lulo, café con
  leche o chocolate hasta la rayita, y el hielo que pida).
- **Fresería** (fresas con crema a la colombiana): *Picar* (el vaso y las fresas: se cortan **deslizando el
  dedo** en mitades, cuartos o láminas; se califica qué tan derechito y centrado quedó cada corte), *Batir*
  (crema de leche hasta la rayita, cucharadas de leche condensada, arequipe o chocolate, y batir hasta el
  punto **suave** o **firme**: si se pasa, la crema se corta), *Servir* (bañar con la crema hasta el borde
  y decorar: queso rallado, leche condensada, arequipe, chispitas, fresa entera, masmelos, barquillo,
  helado, menta, galleta).
- **Frapería**: *Preparar* (vaso de 12, 16 o 20 oz, los bombazos de la base —café, chocolate, moca, fresa,
  caramelo, galleta, maracuyá, matcha—, las cucharadas de hielo y la leche hasta la rayita), *Licuar*
  (hasta **grueso**, **normal** o **cremoso**, sin que se agüe) y *Decorar* (crema chantilly a la altura
  que pide, salsas, toppings, cereza y el pitillo del color que pide).
- **Progreso como en Papa's**: puntos de chef por cada plato (el % de la calificación) suben el **rango**
  (Aprendiz, Ayudante de cocina… Leyenda de la cocina) y cada rango trae masas, bases, toppings, bebidas,
  cortes e invitados nuevos. Cada día vienen más invitados (3 el primero, hasta 10), más seguido y pidiendo
  cosas más complicadas, así que hay que **mejorar la cocina con las propinas**: otra wafflera / batidora /
  licuadora, turbo (25 % y 50 % más rápido), alarma de punto, guía de emplatado (marquitas de dónde va cada
  pieza), cuchillo de chef (perdona más y muestra por dónde cortar), dispensador o jarra de precisión, parlante
  con música (paciencia) y frasco de propinas bonito (más propina).
- **Premio para la casa** al terminar cada día: monedas (según invitados y calificación, hasta 20) y **platos
  de chef** a la despensa —*Wafles de chef* (+70 comida), *Fresas con crema de chef* (+55 comida, +18
  cariño) y *Frappé de chef* (+30 energía)— que no se venden en la tienda, llenan mucho más y **se pueden
  regalar** (al abrirlo, la pareja se lo come y suma 15 de cariño extra: «lo cocinó con sus propias manos»).
- **Gráficos**: todo lo de las estaciones son recortes renderizados en Blender (Cycles, estilo plastilina):
  wafles en 4 masas × 4 puntos de cocción, waffleras con tapa de vidrio, jarras, toppings, fresas enteras y
  cortadas, batidora con su tazón, licuadora, botellas con bomba, vasos con su forma medida (el líquido se dibuja
  adentro con menisco, burbujas, hielo y chorro), canecas, impresora de tiquetes, campanita y frasco de propinas,
  más los fondos de cada restaurante (comedor, mostrador, cocina y mesón, con su color). Encima va lo vivo: salsas
  con volumen y gotas, crema, licuado con remolino, chispitas que caen, vapor, humo, chispas, salpicaduras,
  brillo del plato perfecto, monedas que vuelan y el tiquete que sale de la impresora. Los invitados tienen 11
  poses (caminar, esperar, impacientarse, bravo, comer, encantado, contento, así-así) y la pareja tiene las
  suyas, más expresivas. Las estaciones se cambian deslizándose (el riel y la barra quietos). A 30 cuadros como
  tope; si el celular va lento, baja la calidad sola.
- **Juntos, de 2 a 4, en una sala** (`src/casa/cocina/sala.ts` sobre las salas de `src/salas/`, ver
  `docs/salas.md`): en la hoja de restaurantes, «💞 Cocinar con Laura/Javier» abre una sala y la invitación le llega
  al otro a la casa con el código («¡Vamos a cocinar!» entra a esa sala); «👥 Cocinar con amigos» abre una sala para
  compartir el código y «🔑 Unirme con un código» entra a la de otro. En la **sala de espera** (con mantel de
  cuadritos y el chef de cada uno) el anfitrión escoge el restaurante («🍳 Restaurante»), cada uno toca «Estoy
  listo» y el anfitrión arranca. Se cocina en el restaurante del anfitrión (su día, su rango y sus mejoras), cada
  uno en su celular: el anfitrión manda (invitados, tiquetes, reloj, calificación y propinas) y los demás le piden
  las cosas (mensajes fiables de la sala); los tiquetes son de todos: cualquiera toma un pedido o se queda en una
  estación, y se ve la carita de cada uno (con el color de su puesto) en la estación donde está, en el tiquete que
  tiene escogido y su mano moviendo la comida. Las propinas y el avance del día son de todos; cada uno guarda su
  propio rango y puntos en su restaurante; las monedas y los platos de chef de la casa son del anfitrión (si es
  Javier o Laura). Si alguien pone pausa o sale de la app, a todos les sale la pausa con su nombre; si se le corta
  la red a alguien, la cocina se queda quieta con «Se cortó la conexión con…» y sigue sola al volver (el anfitrión
  puede «Seguir sin…»); si alguien se va, los demás siguen; si se va el anfitrión, a los demás les sale el aviso. Al
  final del día el anfitrión sigue con otro día o vuelve con todos a la sala de espera («👥 A la sala»).
- **Dificultad por cocineros** (`POR_COCINEROS` en `motor.ts`): cada cuánto llegan ×1 / 0,8 / 0,7 / 0,62, paciencia
  ×1 / 0,85 / 0,8 / 0,75 e invitados extra por día 0 / 0 / 2 / 4.
- Sincronización (`linea.ts`): objetos con versión (el día, cada máquina y cada tiquete), paquetes rápidos cada
  ~110 ms y una foto completa del anfitrión cada segundo; gana la versión más alta y, si empatan, la del anfitrión.
  Los cortes, el segundo plano y quién se fue los avisa la sala. Las ids de los wafles van por puesto (no chocan).
- **Modo neutro** (si cocina un amigo o hay amigos en la sala): la pareja no llega a comer (ni sus frases, apodos y
  corazones), los invitados no dicen «mijo|mija», el tablero dice «hecho con sazón» con estrellas, nada de 💞 ni
  «en pareja», y la tarjeta del final no habla de regalar platos. El letrero del restaurante lleva el nombre de su
  dueño («La Waflería de Javier», «… de Pipe»).
- **Los amigos, sin la casa (`cocina.html`)**: el menú de los tres restaurantes (con su plato servido, el día y el
  rango de cada uno), «👥 Cocinar con amigos», «🔑 Unirme con un código» y «🎮 Mis juegos». Su chef es **su muñeco con
  sus colores**, renderizado ahí mismo con el gorro y la chaqueta de chef en las mismas poses de los recortes de
  Javier y Laura (`chef_amigo.ts`; mientras tanto, su carita con gorro). Su progreso va en el aparato
  (`amigo-cocina-progreso`, uno por restaurante). `cocina.html?unirse=CÓDIGO` entra directo a una sala (lo usa
  «Unirme con un código» de la sala de juegos) y `cocina.html?receta=wafles` abre ese restaurante. Si el aparato
  no está en modo amigo, la página manda a la casa.
- **Gancho para escenas**: `cocina.alTerminarDia.push((dia, info) => …)` (o `alTerminarDia` en las opciones de
  `jugarCocina`) se llama al terminar cada día con el resultado, la receta, el rol, si fue en pareja y el rango
  antes y después. Hoy no hay escenas enganchadas.
- Código: `src/casa/cocina/` (motor.ts: invitados, tiquetes, calificación, día, mejoras, pausa y segundo plano;
  linea.ts: la sincronización en pareja; wafles.ts, fresas.ts, frappes.ts: las estaciones; pantallas.ts: comedor,
  riel, barra, calificación y «modo chef»; sprites.ts, vasos.ts, efectos.ts: recortes, líquidos y partículas;
  herramientas.ts: chorrear, espolvorear y poner piezas) y `cocinar()` en `src/casa/main.ts`.
- Recortes: `python3.11 personajes/blender/cocina_sprites.py juego/web/modelos-crudos/cocina [claves]` y
  `cocina_fondos.py` (necesitan `bpy` 4.2 para python3.11), luego `python3.12 personajes/blender/cocina_atlas.py
  juego/web/modelos-crudos/cocina juego/web/public/cocina` (hojas webp + `hojas.json`). Los invitados y el chef:
  `node scripts/generar-sprites-cocina.mjs [claves] [puerto]` con el servidor prendido. Los platos 3D de la casa
  salen de `personajes/blender/comidas.py`.
- Pruebas: `scripts/cocina-prueba.html` (la cocina sola, con `?rol=&receta=&xp=&dia=&mejoras=`, y juntos con
  `&sala=crear` o `&sala=CÓDIGO`, más `&salas=local` para ir entre pestañas), ganchos `window.__cocinaMotor.probar('llegar'
  | 'tomar' | 'jugar' | 'juicio' | 'fin' | 'avanzar', segundos)`, `.resumen()` y `.otros()`; `node
  scripts/probar-cocina-linea.mjs [receta] [url]` (Javier y Laura en una sala con un Supabase de mentiras con demoras
  y pérdidas: sala de espera, pedidos, entregas, pausa, salir de la app, corte de red, fin del día iguales en los
  dos, el premio de la casa del anfitrión, «A la sala» y el anfitrión que se va) y `node
  scripts/probar-amigos-juegos.mjs [url]` (un amigo vuela el retrete por todos los tramos, la tienda y volar otra vez;
  cocina dos días solo y uno en sala con otra amiga; nunca ve nada de la pareja —pantalla, avisos que pasan y textos
  dibujados en los lienzos— ni se pide nada de la casa, y el progreso queda en el celular).

## Recuerdos en el baño y abrazados en la cama

- **Bañarse** dura 55 s: en la tina quedan en ropa interior (Él sin camisa y en bóxer, Ella en ropa
  interior rosada; la ropa comprada se esconde salvo el peinado) y al salir se vuelven a vestir.
- Mientras tanto sale una burbuja de pensamiento con **recuerdos** al azar: los 20 recuerdos de verdad de Cien
  Puertas, cada uno con su dibujito animado y lo que se dijeron. Se leen con calma: entre un recuerdo y otro la
  lámina se cubre de **neblina** y se despeja con el siguiente (como pasar de diapositiva); cada frase se
  **escribe letra por letra** (con su cursor) y se queda lo que tome leerla (2,4 s como mínimo, más si es larga).
  Los dos **reaccionan a lo que se dice** y sostienen la reacción toda la frase: se ríen sacudiéndose con un
  «jajaja», lloran temblando y el otro abraza, se ponen tímidos con un «te amo», celebran brincando, se
  sorprenden con un brinquito, presumen, hacen puchero o se quedan pensando con una pregunta.
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
- Con la tele prendida (en grande o en la ventanita) la **música de la casa se calla** para que se oiga el video, y
  vuelve al apagarla (sin cambiar si la música estaba prendida o apagada en el menú).
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
| Minijuegos (súper, Cien Puertas, juegos de mesa, Sangre y Ceniza) | lo que pague cada juego (cada uno paga la cuarta parte de antes); llega por `nuestro-hogar-sueldo` y la casa lo suma tal cual, sin volver a dividirlo |
| Trofeos | 5 / 10 / 20 por bronce, plata y oro de cada juego (una vez); la copa del amor, el triple |
| Cocina de chef | 1 a 20 por día cocinado (invitados × calificación) y hasta 4 platos de chef a la despensa |
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

**Conceptos para los cuartos propios** (tienda → Decoración → «Conceptos»): 20 estilos ya armados — Gamer, Griego,
Egipcio, Espacial, Playa tropical, Japonés, Princesa, Rock y música, Fútbol, Colombiano, Pirata, Cabaña del bosque,
Kawaii, Biblioteca, Navidad, Halloween, Cine, Retro 80s, Romántico y Nórdico. Cada uno trae las 9 piezas del cuarto
(3 de pared, 2 de mesa, 1 peluche y 3 de piso: piezas nuevas de `deco_conceptos.py` —114 en total— y algunas de las
de siempre que combinan) con 30 % de descuento, y al comprarlo **queda puesto en tu cuarto y le pinta las paredes**
con su color (lo que había vuelve al inventario). Las piezas quedan guardadas una por una: en «Decorar» se mezclan
con las de otros conceptos, y en la tienda también se venden sueltas (filtros Pared, Mesa, Piso y Peluches). Las
que tienen luces (neón «GG», paneles hexagonales, barra LED, torre gamer, audífonos, corazón de neón, neón de
palmera, lámpara de lava, hongos, estrella y guitarra eléctrica) **se pintan de otro color** tocándolas en
«Decorar» (8 colores; se guarda como `id#rrggbb` en el sitio y se pintan solo sus materiales «tinte»).
Regenerar: `blender -b -P exportar_tienda_casa.py -- <juego/web/modelos-crudos> [claves]` y luego
`SOLO='^deco_' node scripts/optimizar-modelos.mjs`.

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
- **Disfraces de pareja** por **rareza** (tarjetas con borde de color; las doradas brillan). Traen todas las
  piezas para los dos y se ponen de una vez desde el clóset. Las piezas de los disfraces nuevos solo vienen con su
  disfraz (no se venden sueltas). Precio: las piezas × 0,75 × el factor de la rareza, con un mínimo.

| Rareza | Detalle | Precio | Disfraces |
|---|---|---|---|
| Blanco · común | el de siempre | ×1 | gatitos, conejitos, ositos, pandas, dinos, unicornios, héroes, piratas, brujos, angelito y diablito, abejitas, chefs, novios, reyes, vaqueros, hinchas, Navidad, astronautas, payasitos, doctores, hawaianos |
| Verde · especial | el doble | ×1,5 (mín. 180) | tigres (rayas), ovejitas (lana en motas), leoncitos (melena) |
| Azul · raro | el triple | ×2 (mín. 300) | Lilo y Stitch (orejas y camiseta de Stitch; vestido rojo de hojas con collar de flores), ranitas (ojos saltones, pintas, patas con ventosas), vaquitas (manchas, cachos, campanita), pollitos (plumitas, alitas, cascarón en la cabeza) |
| Morado · épico | cinco veces | ×3 (mín. 520) | pandas con bambú (brazos y piernas negros, manchas de los ojos, atado de bambú), el perrito y la pulguita (collar con placa de huesito, orejas caídas, lengüita · caparazón por segmentos, ojos compuestos, antenas y patitas de más), sirena y tritón (cola de escamas con aleta, conchas y perlas · corona, camisa y pantalón de escamas, tridente), zorritos (pechera, coronita de hojas y bellotas, cola esponjosa), arepa y chocolatico (arepa con parrilla y queso derretido, gorro de mantequilla · taza con flores, espuma, queso y canela), ratoncitos de Transformice (orejotas, bigotes, dientes, queso a la espalda) |
| Dorado · legendario | diez veces | ×5 (mín. 900) | **Stitch y Angel** (enterizos con panza, manchas y púas, capuchas con orejotas, ojazos, pestañas y antena, garras, pantuflas con deditos), **silleteros de la Feria de las Flores** (sombrero aguadeño tejido, ruana al hombro, pañuelo, carriel con flecos · sombrero de flores con cintas, vestido de chapolera; silletas de madera cargadas de flores: la redonda con girasol y la del corazón), **dragones** (placas, escamas, cresta, cuernos, ojos de reptil, colmillos, alas con membrana, cola con flecha, garras) |

- Las piezas elaboradas juntan en una sola malla lo que comparte material y hueso (flores, escamas, pelitos): así
  un disfraz de cientos de piezas no hace cientos de llamadas de dibujo en el celular. Código:
  `personajes/blender/ropa_disfraces.py` (vista previa: `vista_disfraz.py`).
- Lo puesto se guarda en el estado de cada personaje (`ropa` y `colorPelo`) y la pareja lo ve en línea.

## Recuerdos y fechas

- **Álbum**: fotos con título y fecha (se reducen a 1280 px). En línea van a la carpeta privada de la pareja.
- **Fechas**: el aniversario y otras fechas (cumpleaños, primera cita…) con cuenta regresiva; arriba aparece
  «Faltan N días» cuando falta un mes o menos. El día del aniversario llueven corazones.
- Al volver a la app: «Mientras no estabas, Ella te dejó 2 besos y 1 regalo».

## Pantallas de carga

Mientras carga la casa, el súper o Cien Puertas, Él y Ella hacen tonterías en una escenita (sale una distinta
cada vez y cambia a otra si la carga se demora): guerra de almohadas, se persiguen (y luego ella a él con la
chancla), globo de agua, pastel en la cara, cosquillas, baile loco, ¡BU!, choque de manos fallido, confeti
sorpresa, avioncito de papel con carta de amor, cojín pedorro, concurso de músculos, palomitas al aire, bolas
de nieve, beso robado, burbujas, la última arepa (que se la roba el perrito) y la selfie. Son 18 en
`src/carga.ts` (canvas 2D) con recortes de los dos sacados del modelo 3D a la misma escala y con los pies
marcados (`scripts/generar-sprites-carga.mjs` → `public/carga/` y `src/carga_recortes.json`).

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
- Color: el toque de los renders de Blender (saturación 1,28 y contraste 1,05 sobre el tono AgX) va dentro del
  sombreador del tono (`src/tono.ts`), no como filtro CSS del lienzo: el filtro obligaba al celular a un paso extra
  cada cuadro (más calor y parpadeos en algunos Android). En calidad baja el color de fondo se calcula igual en JS.
- Si Android le quita al juego el dibujo 3D (poca memoria), se espera a que lo devuelva y, si no vuelve en 5 s, se
  recarga la página en vez de quedarse en blanco (`src/contexto.ts`, en la casa, el súper, Cien Puertas y la mesa).
  Los minijuegos con su propio dibujo 3D (el retrete espacial, las escenas grandes) lo sueltan al salir
  (`forceContextLoss`): si se acumulaban, Android le quitaba el suyo a la casa. El apagón del baño es un velo encima
  (`#velo`), no un filtro sobre el lienzo.
- Las pestañas de las hojas (tienda, clóset…) no se encogen con listas largas (antes se tapaban los nombres).
