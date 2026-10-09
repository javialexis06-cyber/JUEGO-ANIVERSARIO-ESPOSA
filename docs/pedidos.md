# Pedidos de Javier en cola

Lo que Javier pidió y todavía falta, en el orden en que se va a hacer. Se tacha (se borra) cuando queda hecho,
probado y subido.

## Por dónde seguir (nota para el próximo Claude)

Último trabajo subido: **los arreglos de Sangre y Ceniza que Javier encontró jugando** (9 de octubre: sigilos, visión
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
3. **Lavarse la cara 2** (`docs/en-obra/lavado-propuesta.md`): Javier ya respondió las 5 preguntas (9 de octubre;
   están anotadas en la propuesta).
4. ~~**Amigos: mesa, retrete y cocina en la app de amigos**~~ **hecho**: la app de amigos ya trae los seis juegos.
5. **El Show de Nosotros** (rama `trabajo/show`, en «Lo acumulado»).
6. **Cien Puertas con mucho más diseño** (punto 4 de «Ahora»): es para lo último.

Esperan a Javier (no se empiezan solos): lo que sigue abierto de la mitología (sección 2 de `docs/mitologia.md`), las
las ideas del sótano, la
clave de ElevenLabs para las voces, pegar `supabase/cambios-pendientes.sql`, y si quiere el repositorio privado.
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
- Voces con IA: esperan la clave de ElevenLabs (`docs/en-obra/voces-ia.md`).
