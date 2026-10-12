# Pedidos de Javier en cola

## Frente de granja en paralelo

**Arreglos de la granja (12 de octubre, lo siguiente que se hace):** Javier mandó una lista larga (rendimiento, menú de
3 rayitas, mochila tipo Minecraft, mapas reales con marcadores, caminos, lagos, mina, semillas, historia que te lleve a
los lugares físicos). ChatGPT se quedó sin uso: Claude hace todo. El plan por tandas, con lo ya encontrado en el código
(archivos y líneas), está en [`en-obra/granja-arreglos.md`](en-obra/granja-arreglos.md). Las tandas 1 (rendimiento y
calidad alta en PC), 2 (menú, Escape, E, mostradores y barra) 3 (mochila estilo Minecraft y habilidades
simples) 4 (minimapa y mapa grande con fotos de verdad y marcas) y 5 (salidas anchas, caminos, pueblo, postes guía, mina
cuadrada, semillas y estanques por casillas) quedaron **hechas**. La tanda 6 quedó **hecha** (12 de octubre): Gremio de Aventureros y
Museo del Valle, terreno en la carpintería, vecinos por partes, inicio guiado, campaña por cartas y vecinos, y Campaña y
Astra unificadas. **Siguiente**: el prólogo en película (`docs/sistemas/cine-granja.md`) espera que Javier lo vea; si le
gusta, se hacen las demás escenas grandes con el mismo estilo. Las voces del prólogo quedaron **hechas** (celestial «suave») y se queda con su música
de antes (M12 y M13).

**La película de Astra (12 de octubre, aprobada con cambios):** todas las escenas animadas unidas como una sola película
(prólogo, 14 cinemáticas, 5 de Sangre y Ceniza, 6 secundarias, el Altar del Lazo y **la boda** «Siempre te elegiré» en
un escenario tipo Casa Eterna de Sopetrán, oficiada por Lara), más **presentaciones de cada lugar** (6 llegadas y 33
postales) y la planeación de cuatro minijuegos futuros. Está en [`en-obra/pelicula-de-astra.md`](en-obra/pelicula-de-astra.md).
Los **arreglos de coherencia quedaron hechos** (una voz por diosa, Fuatia celestial, Serena y Eliana con nombre, entrada
de Fuatia en C11, la boda como canon). **Siguiente**: escribir los guiones que faltan y animar el Acto I. **Espera a
Javier**: qué dice Laura en la boda, fotos o descripción de la Casa Eterna y revisar los votos.


**Prioridad actual, 11 de octubre:** Javier encargó una base narrativa profunda para conectar granja y
Sangre y Ceniza. Entrega local en [narrativa/README.md](narrativa/README.md): cosmología y cronología,
142 biografías y arcos personales, cinco figuras divinas, 24 misiones principales, doce secretos,
19 encuentros comunitarios, 98 relaciones y guiones de audio. Es diseño escrito, no campaña ya ejecutable.
Los pushes siguen pausados por su instrucción mientras Claude trabaja. No retomar publicación automática
por las instrucciones anteriores de esta cola; los cuadernos K07 también permanecen locales.

Javier pidió integrar la granja existente, subir cada avance probado y repartir el trabajo: el frente de granja continúa motor, sistemas e historia; Claude hace gráficos, diseño de personajes y presentación visual. Leer [`en-obra/granja-coordinacion.md`](en-obra/granja-coordinacion.md). El motor sigue en desarrollo; cuatro festivales básicos ya conectados (ver `juego/web/src/granja-v3/FESTIVALES-INTEGRACION.md`); ofertas diarias/semanales y tres especiales de dos etapas ya integrados (ver `juego/web/src/granja-v3/ENCARGOS-INTEGRACION.md`); dos proyectos de correspondencia con cuatro ramas excluyentes, recetas útiles y decisiones persistentes ya integrados (ver `juego/web/src/granja-v3/CORREO-INTEGRACION.md`); seis lotes del archivo con donaciones, premios únicos y reserva de semillas durante todo el año ya integrados (ver `juego/web/src/granja-v3/COLECCIONES-INTEGRACION.md`); tres cuadernos recuperables con lectura persistente, prospección y recetas rápidas ya integrados (ver `juego/web/src/granja-v3/LIBROS-INTEGRACION.md`); siguiente bloque previsto: identificación y uso de hallazgos mineros (F11). Esto no reemplaza el orden de los demás pedidos de esta cola.

**Gráficos de la granja (Claude, regla «todo en Blender»):** ya están en Blender los muebles de todos los interiores, la decoración de los cuatro festivales, el Pueblo del Sol entero (14 edificios, 2 altares, fuente, bancos, faroles, jardineras, vallas, árboles, molino, corral), el monte de todas las zonas, los arcos y letreros de las salidas, lo que se ve más allá de cada arco, lo hecho por mano en la cueva de la mina y el cuerpo de las máquinas de producción. Falta (en este orden): obras de construcción y refugios por dentro, invernadero por dentro, nodos de la mina, caja de envíos y cuencos de los compañeros, herramientas en la mano, monstruos de las aventuras e íconos 3D. Detalle en `en-obra/granja-coordinacion.md`.

**Astra (11 de octubre, pedido de Javier):** ya son pueblos de verdad, cuatro veces más grandes.
- Cada uno tiene calle con faroles, plaza empedrada con monumento, puestos de oficio con letrero, huertas, pozo y su hito
  al norte (faro, árbol ancestral, mina, termas, estanque helado, atalaya, rosaleda, pilar de hilos, cristal sellado o
  nave).
- Casas y paisaje propios de cada región, todo hecho en Blender.
- 154 habitantes con ropa propia que caminan por la calle.
- 36 vecinos nuevos con trasfondo.
- 42 encargos con recompensa, 6 de ellos entre pueblos.

Falta:
- Los arreglos de [`en-obra/granja-arreglos.md`](en-obra/granja-arreglos.md) (voces y música de la granja ya están).

Lo que Javier pidió y todavía falta, en el orden en que se va a hacer. Se tacha (se borra) cuando queda hecho,
probado y subido.

## Por dónde seguir (nota para el próximo Claude)

Último trabajo subido: **Lavarse la cara 2, fase 2** (seis tesoros del baño con flecha verde; los seis modos del
original: Hiper, Del otro lado del espejo, Agua caliente sin fin, Sin límite, Ruleta de sorpresas y Nivel al azar; y
Don Jabón, el vendedor ambulante, con el Monedero) y **La Ducha** (fase 3a: el cuarto escenario, con 8 bichos y 4
jefes nuevos y los chorros que caen del techo) y **La Jabonera** (fase 3b: el pasillo de arriba abajo de la repisa con
los frascos que se caen) y **El Desagüe** (fase 3c: el escenario final con sus remolinos) y los dos primeros
especiales (3d: **El Desfile de jefes** y **El Espejo empañado**) y **La Matera de la ventana** (3e) y **El Tobogán del
desagüe** (3f), **El Laberinto de la cortina** (3g) y **La Feria de las cremas** (3h, con la ruleta del Ruletero:
con ella quedan todos los escenarios de la propuesta). Javier pidió (12 de octubre) pasar ahora a los
arreglos de la granja que venía haciendo el otro frente (`en-obra/granja-arreglos.md`: tandas 1 a 5 **hechas**; la 6
espera que Javier diga si la hace este frente o el del motor) y después seguir con lo que falta del lavado. La fase 4
ya está completa (4a y 4b: ocho disfraces con transformación y cajitas sorpresa; 4c: las cartas de la noche; 4d: las
aventuras de la protagonista por capítulos); con la Radio y los bichos especiales, **Lavarse la cara 2 queda completo**. Antes, **la fase 1 completa** (las 24 armas del juego base y 5 de
los DLC con sus evoluciones, 7 pasivas, 9 recogibles, los 4 arcanos que faltaban, 4 poderes en la tienda y 40 logros
nuevos). Antes, **los arreglos de Sangre y Ceniza que Javier encontró jugando** (9 de octubre: sigilos, visión
astral en pulso, el Guardián de una, sin pantallazo negro y los menús rehechos) y **la app de amigos con los seis
juegos**. Antes, **Sangre y Ceniza 2, fase 5**, con la que **Sangre y Ceniza 2 queda completo**:
equipo común a épico con rarezas especiales, la Forja con tres mostradores, el familiar (siete compañeros con modelo),
el refugio con tres minijuegos y las medallas en relieve como íconos de las mejoras. Antes, la **fase 4**: 26 reliquias que se abren con hitos, los
Desafíos (contratos del día y de la semana para comparar entre los dos, pruebas de maestría, anómalas), 17 mutadores
nuevos, las misiones La Procesión (el Relicario) y La Cría (la Madre de Piedra), los objetivos Exorcismo y Cosecha de
sangre, dos secundarios nuevos y el infinito que crece (con la bajada guardada). Antes, la **fase 3**: el mapa de la Noche (cuatro sectores con sus
Puertas, tres metas por lugar y cinco escenas cortas con Javier y Laura como el Lazo Primordial), Sangre y Ceniza en
la Sala de Trofeos, evoluciones para todas las armas, 14 uniones, 13 armas comunes nuevas con sus modelos y las
especializaciones que abren armas. Antes, la **fase 2** (8 de octubre): los seis minerales del mito y el Pozo que los
pide (con el mercader), el cofre de suministros, dos reglas propias por bioma y seis sobrecargas por arma (templadas y
malditas con etiquetas especiales), la potencia y la regla de las dos armas. Antes, la **fase 1**: etapas que se ganan peleando con la barra de
avance, el Guardián, la Noche se impacienta, 5 etapas con sepulcros y custodios en la final, ratas del tesoro y
ladrón de tumbas, mini-élites, precios que suben y tres secundarios nuevos; la dificultad ahora crece etapa por etapa
(ver `docs/sistemas/sangre-y-ceniza.md`). Antes: el estudio de las dos wikis y la **mitología de Astra** que Javier
trajo de la granja ([`docs/mitologia.md`](mitologia.md)). Javier respondió lo de Sangre y Ceniza 2: **se hace
primero**, con 5 etapas, escenas cortas con la mitología (Él y Ella de protagonistas) y todo lo de armas. Orden:

1. ~~**Sangre y Ceniza 2**~~ **hecho** (las cinco fases de la sección 4 de `docs/en-obra/sangre-propuesta.md`; la 5:
   equipo con rarezas, la Forja con tres mostradores, el familiar, el refugio y las medallas). Quedaron para después,
   anotados en la propuesta: el aceite de lámpara y los sellos de la Procesión, los espejos del castillo y el piso en
   llamas de la abadía.
2. ~~**Sangre y Ceniza: lo que Javier encontró jugando**~~ **hecho** (9 de octubre): sin pantallazo negro, el
   Guardián de una, visión astral en pulso, imán con el nivel, lo minado vuela solo, bombas que rompen vetas, ocho
   sigilos, pantallas que no saltan, globito de ayuda propio, y los menús rehechos (logo en relieve con brasas, Cinzel,
   medallas de logros/desafíos/sigilos, ilustraciones del Pozo y del refugio, juegos del refugio con sprites). Ver
   `docs/sistemas/sangre-y-ceniza.md`. Lo que pidió:
   - pantallazo negro de 1-2 s al subir de nivel (con las mejoras del piso no pasa);
   - el Guardián debe salir apenas se cumple la misión principal (o a los pocos segundos);
   - visión astral como pulso de 1-2 s que cuesta 10 de vida y sube por etapa;
   - textos que se ponen gigantes al pasar el ratón; reliquias del final y el premio de la misión gigantes;
   - el rango de recoger crece con el nivel; lo que se mina con bombas y demás llega solo al inventario; las bombas
     rompen paredes con y sin minerales;
   - al escoger equipo del Pozo la pantalla vuelve al principio (y todos los errores de ese tipo);
   - **sigilos**: minimapa que se descubre al pasar (con el croquis de todo el mapa), brújula de sangre (70 % de la
     vida por señalar el objetivo más cercano) y más ideas;
   - mejores gráficos de lo simple: refugio, logros, Pozo, íconos de desafíos y una pantalla de inicio mucho más
     trabajada (puede ser animada).
3. ~~**Lavarse la cara 2**~~ **hecho** (12 de octubre: las fases 1 a 4, la Radio y los bichos especiales;
   `docs/en-obra/lavado-propuesta.md`). Javier respondió las 5 preguntas el 9 de octubre (están anotadas en la
   propuesta). Fue por partes:
   - ~~1a: 14 armas del original con 15 evoluciones, 7 pasivas (anillos y aretes escondidos en los escenarios) y 18
     logros que las abren~~ **hecho** (ver `docs/sistemas/nuestro-hogar.md`, «Versión 2, fase 1a»).
   - ~~1b: las especiales y las de rebote~~ **hecho** (cortina de baño y de terciopelo, neceser y su regalo de lujo,
     bolsillo de la bata, pececitos y la pecera infinita, confeti, hueso, bomba de baño, barquito, talco y bolitas de
     gel, con 10 logros).
   - ~~1c: recogibles nuevos, los 4 arcanos que faltan, Omni/Encanto/Desarmar/Conservar en la tienda y sus logros~~
     **hecho** (9 recogibles con la fiebre de gotas y el patito dorado que se guarda, 4 arcanos, 4 poderes y 7 logros).
   - ~~1d: una selección de armas de los DLC que encaje con el aseo~~ **hecho** (brisa, sales de las cuatro
     estaciones, bata de seda, gotas de colores y culebrita destapacaños, con sus evoluciones y 5 logros).
   - ~~2a: tesoros y modos~~ **hecho** (seis tesoros con flecha verde; modos Hiper, Del otro lado del espejo, Agua
     caliente sin fin, Sin límite, Ruleta de sorpresas y Nivel al azar; el mapa en la pausa; 4 logros).
   - ~~2b: el vendedor ambulante y el Monedero~~ **hecho** (Don Jabón con su carrito: armas de rebote, patitos
     dorados, el Monedero y, del otro lado del espejo, tiradas, saltos, vetos y una carta).
   - 2c: las cajitas sorpresa (los ataúdes del original: un anillo de mugrosos que hay que vencer para abrir la caja de
     un disfraz nuevo); van con los disfraces de la fase 4, así que se hacen ahí.
   - ~~3a: La Ducha~~ **hecho** (baldosas mojadas, 8 bichos y 4 jefes en Blender, los chorros que caen del techo).
   - ~~3b: La Jabonera~~ **hecho** (el pasillo de arriba abajo de la repisa, 7 bichos y 4 jefes, los frascos que se
     caen).
   - ~~3c: El Desagüe~~ **hecho** (el escenario final: rejillas oscuras, 7 bichos y 4 jefes, los remolinos que se
     tragan la mugre y las gotitas).
   - ~~3d: El Desfile de jefes y El Espejo empañado~~ **hecho** (los dos primeros especiales de 15 minutos: 23 jefes
     uno tras otro sobre el tapete; el vapor que tapa la vista y lo caliente que pega más).
   - ~~3e: La Matera de la ventana~~ **hecho** (las maticas que no caminan pero muerden, tres jefes y la lluvia de
     todo al final).
   - ~~3f: El Tobogán del desagüe~~ **hecho** (la carrera: la corriente lleva a todos, turbos en el piso y banderas
     que recogen lo que quedó atrás).
   - ~~3g: El Laberinto de la cortina~~ **hecho** (cortinas que frenan, bichos grandotes, quesitos de jabón y el Rey
     Ratón).
   - ~~3h: la Feria de las cremas~~ **hecho** (la feria encerrada en vallas que se abre con la ruleta del Ruletero:
     plaza, calle de los puestos y carpa; 5 bichos y 3 jefes nuevos).
   - Fase 4:
     - ~~4a y 4b: disfraces con transformación y cajitas sorpresa~~ **hecho** (8 disfraces nuevos: 4 de rebote que
       se transforman al nivel 80 con su llavecita escondida y 4 que salen de las cajitas sorpresa).
     - ~~4c: las cartas de la noche y la Mascarilla de noche~~ **hecho** (6 cartas que se abren con la Mascarilla de
       noche, tirada en La Bañera).
     - ~~4d: las aventuras de la protagonista~~ **hecho** (13 capítulos en tres aventuras: el carro andando, el bus a
       Barranquilla sin el detalle y los vuelos cancelados; sola o en pareja, con historia antes y después).
     - ~~La Radio (escoger la música)~~ **hecho** (tesoro en La Ducha; 23 canciones del lavado y de los otros juegos).
     - ~~Los bichos especiales~~ **hecho** (el ratón ladrón con su cofre, el Tapón que persigue y la Llave que gotea, que
       inunda el piso).
4. ~~**Amigos: mesa, retrete y cocina en la app de amigos**~~ **hecho**: la app de amigos ya trae los seis juegos.
5. **El Show de Nosotros** (rama `trabajo/show`, en «Lo acumulado»).
6. **Cien Puertas con mucho más diseño** (punto 4 de «Ahora»): es para lo último.

Esperan a Javier (no se empiezan solos): lo que sigue abierto de la mitología (sección 2 de `docs/mitologia.md`), las
las ideas del sótano, la
pegar `supabase/cambios-pendientes.sql`, y si quiere el repositorio privado.
Si cuenta anécdotas nuevas: van primero a las cartas de amor de Lavarse la cara y a las cartas del súper (hoy
inventadas), mirando «Quién cuenta qué» en `docs/la-pareja.md`.

## Ahora

Javier: «por ahora vamos a concentrarnos en crear el tipo Clue, terminar de pulir los juegos que ya tenemos y dejar
pulido el repositorio».

1. ~~**Clue clásico en la mesa**~~ **hecho**: «¿Quién fue?» (`mesa.html?juego=clue`, diseño en `docs/sistemas/clue.md`).
   Queda pendiente solo lo que Javier pida al probarlo. Idea de Laura para guardar: que su boda tenga «un crimen por
   mesa que deban solucionar».
2. **Pulir lo que ya hay** (ver «Sangre y Ceniza» y «Ronda 2» abajo). Lo que Javier recalcó:
   - ~~Lavarse la cara: íconos y panel de lo que se tiene~~ **hecho** (los íconos salían vacíos en la APK; la pausa
     tiene «Mochila» y «Evoluciones», ver `docs/sistemas/nuestro-hogar.md`).
   - ~~Sangre y Ceniza: mapas mucho más detallados en calidad alta~~ **hecho** (pisos con textura nítida, roca de
     cada bioma en las paredes, detalle regado y aire de cada bioma; baja y media quedan como estaban; ver
     `docs/sistemas/sangre-y-ceniza.md`, «Tres calidades»).
   - ~~Súper Manía, volver a algo más parecido al original~~ **hecho** (tanda única): sin estantes de dos caras y la
     mitad de cada tipo, el mismo local crece en 4 tamaños sin perder nada (días 1-100), dificultad del original
     (carrito de 5, meta y meta experta), 12 cartas en ciertos días, mejoras solo desbloqueadas y el súper en la app
     de amigos. Ver `docs/sistemas/mecanicas.md` (punto 9). Las cartas del súper se pueden cambiar por anécdotas
     reales si Javier quiere contar más del mercado en Sopetrán (`src/recuerdos_super.ts`).
   - ~~Que nada romántico se repita entre juegos~~ **hecho**: los 20 recuerdos son solo de Cien Puertas; la bañera
     cuenta discusiones bobas del chat (16), la cama además los sueños (10), las cartas de Lavarse la cara son cartas
     de amor sin historia y tres aventuras de «la protagonista», y se cambiaron los mimos, frases, escenas y cartas que
     repetían algo de otro juego. La tabla «Quién cuenta qué» de `docs/la-pareja.md` dice a quién le toca cada cosa.
     Si Javier cuenta más anécdotas, van primero a las cartas de Lavarse la cara y a las del súper (hoy inventadas).
3. **Repositorio pulido** en GitHub: sin cosas obsoletas, README y CLAUDE.md al día (se hizo una primera limpieza; se
   sigue cuidando en cada cambio).
4. **Cien Puertas con mucho más amor y diseño** (para lo último, después de Sangre y Ceniza y lo urgente). Javier:
   «las puertas están muy simples, ya sabes cómo me gustan las cosas». Ya funcionan todas (revisión completa y prueba
   en pareja en verde, `docs/sistemas/cien-puertas.md`); falta subirles el detalle: cuartos llenos, objetos con más
   piezas, materiales y adornos, nada vacío y nada que tape lo importante.

## Sótano de la casa nueva (zona con varios juegos)

Javier tenía una lista de juegos para un sótano (zona nueva de la casa). Lo único que quedó escrito es el juego de
terror y el de crímenes (abajo, en «Después»): **falta que Javier pase las demás ideas** para documentarlas aquí.

## Sangre y Ceniza: correcciones y mejoras (pedido de Javier tras probarlo)

~~**Versión 2**~~ **hecha** en cinco fases (8 y 9 de octubre; cómo quedó en `docs/sistemas/sangre-y-ceniza.md`): misiones que llenen la etapa (se ganan matando al
Guardián, la Noche se impacienta), más tipos de misión, dificultad y precios que suben, seis minerales para el Pozo,
mapa de la Noche con historia y retos por bioma y clase, maestrías, contratos, infinito con mapa que crece y refugio
con minijuegos, y (sección L) seis sobrecargas por arma con etiquetas especiales, evolución para todas las armas y
uniones, 13 armas comunes nuevas, reliquias por hitos y el familiar que acompaña:
[`docs/en-obra/sangre-propuesta.md`](en-obra/sangre-propuesta.md) (preguntas al final). Los íconos más elaborados de
las mejoras quedaron como medallas en relieve (fase 5).

Textual: «Mejorar calidad de mapa; mejorar movilidad, se siente tosca, los ojos se cansan o se abruman por la
velocidad, se siente raro…»
- **Calidad**: mapas, enemigos, personajes «y todo lo demás»; «los sprites están muy básicos, falta mucho trabajo de
  texturas».
- **Dos niveles de calidad**: la de hoy como «baja» (celulares menos potentes) y una «alta» con mapas mucho más
  detallados para el S24 Ultra y el computador.

## Ronda 2 de arreglos

**Lavarse la cara (Vampire Survivors)**
- ~~Chorro más translúcido, ataque a mano o solito, tutorial, íconos y panel de combinaciones~~ **hechos** (ver
  `docs/sistemas/nuestro-hogar.md`).
- ~~Logros y recompensas por avanzar con cada personaje/disfraz~~ **hecho**: maestría de 10 niveles por disfraz con
  gotas, bonos propios y marcos de plata y oro (ver `docs/sistemas/nuestro-hogar.md`).
- Seguir mejorando el minijuego con lo mejor de otros juegos del género, **sin chocar con Sangre y Ceniza** (que se
  queda con lo oscuro, las cuevas excavables, las expediciones por etapas y las clases serias). **Propuesta entregada**
  (falta pulirla con Javier): [`docs/en-obra/lavado-propuesta.md`](en-obra/lavado-propuesta.md), con las 24 armas del
  juego base que faltan, 7 pasivas, cartas, recogibles, poderes, escenarios, modos, tesoros, mercader, cajitas
  sorpresa, disfraces con transformación y logros.

## Amigos: lo que sigue

- ~~La mesa, el retrete y la cocina en la app de amigos~~ **hecho**: la «Sala de Juegos» ya trae los seis juegos
  (Sangre y Ceniza, Lavarse la cara, Súper Manía, los juegos de mesa, el retrete espacial y la cocina de chef), con lo
  de la pareja sacado a archivos aparte y su versión neutra (ver `docs/sistemas/salas.md`, «Versión para amigos»).
- **El repositorio es público**: los enlaces de «Invitar amigos» llevan el nombre del repositorio y cualquiera puede
  leer los documentos de la pareja. Opciones para Javier: volverlo privado y publicar las APK en otro repositorio
  público solo de descargas, o dejarlo así.

## Después
- Sótano tétrico con contraseña y juego de terror estilo *No, I'm Not a Human* (estudio del género, historia
  profunda).
- Juego de resolver crímenes: 10 casos revisando el celular de la víctima (apps parecidas a las reales, personas
  ficticias). Ojo: a Laura se le ocurrió que su boda tenga un juego así («un crimen por mesa que deban solucionar»).

## Lo acumulado (en orden)

- **La casa y la mitología** (cuando exista la granja): el Altar del Lazo Primordial, el Álbum y las reliquias del
  multiverso para decorar, con lo que se gana en Sangre y Ceniza y en la granja (`docs/mitologia.md`, sección 5).

- **El Show de Nosotros** (rama `trabajo/show`, sin juntar; `mesa.html?juego=show`): concurso de preguntas de pareja
  con estudio 3D, presentador perrito, seis tipos de preguntas, pregunta del día en la nevera, el libro de nosotros y en
  línea. El último commit (`ab7d01a`, «avance en obra») quedó sin revisar. Falta: revisarlo, correr `probar-show.mjs` y
  `probar-show-linea.mjs`, mirar capturas del estudio (Javier y Laura en la tarima, el texto de las pantallas al
  derecho), juntar y subir. Diseño en `docs/show.md` de esa rama.
- Tele compartida, tocador de Laura, escenas premium (en pausa) y diseños premium.
- ~~Música de todos los minijuegos y efectos de las escenas~~ **hecho** (11 de octubre): 60 pistas (81 min) con
  Eleven Music, 5 canciones con letra (casa, Cien Puertas, súper, cohete, cocina), metal sin letra en Sangre y Ceniza
  y Lavarse la cara, y 43 efectos de verdad para las escenas premium y la mesa (`docs/sistemas/musica.md`). Falta la
  granja (cuando esté más avanzada) y el Show cuando se junte.
- ~~Voces con IA~~ **hecho** (11 de octubre): 1.727 frases de Él y Ella con su voz y su emoción en Cien Puertas, la
  casa, la mesa, el cohete, la cocina, las cartas del súper y Sangre y Ceniza (`docs/sistemas/voces.md`). Falta
  sumar las frases sueltas que todavía no están en el guion (ver «Pendiente» allá).
