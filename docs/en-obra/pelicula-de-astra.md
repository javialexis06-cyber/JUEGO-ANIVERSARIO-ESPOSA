# La película de Astra (propuesta para Javier)

**Pedido del 12 de octubre de 2026.** Javier quiere que todas las escenas animadas, una detrás de otra, sean una sola
película del lore: coherente, unida y que dé gusto avanzar. Las piezas son el prólogo, las 14 cinemáticas, escenas de
Sangre y Ceniza y seis misiones secundarias con carga emocional. Al final va **la boda de Javier y Laura**, donde él
le dice que sin importar cuántos ciclos pasen, cuántos universos o mundos visiten ni en qué planeta vivan, siempre la
va a elegir a ella. También deja planeados cuatro minijuegos futuros: peleas, carreras, buscar a una persona
desaparecida en un celular y un tower defense del lore.

Este documento es **el plan, aprobado por Javier el 12 de octubre de 2026**: qué escenas, en qué orden, qué guion tiene cada una y qué falta en voces y
música. Los minijuegos nuevos se desarrollan después; aquí solo queda lo que van a necesitar en animación y voces.

Motor de las películas: [`sistemas/cine-granja.md`](../sistemas/cine-granja.md). Canon: [`mitologia.md`](../mitologia.md)
y la biblia [`narrativa/`](../narrativa/README.md).

---

## 1. La idea: una sola historia de amor contada en 28 escenas

La biblia de Astra cuenta una campaña muy cuidadosa (consentimiento, límites, nadie compra la salvación de nadie), pero
casi sin romance: dice «sin pedir declaración sentimental» y «no hay coronación de Él y Ella». La película mantiene ese
tono en todo el camino y deja el romance para lo que el canon ya dice: **el Lazo Primordial es el amor de Javier y Laura**,
y de él brilla la Constelación de los Amantes que hace indestructible el escudo. La boda es el momento en que eso se dice
en voz alta.

**Tres hilos que atraviesan todas las escenas** (para que al verlas seguidas se sientan una sola película):

1. **Las dos manos.** La Constelación de los Amantes dibuja dos manos entrelazadas. Cada escena termina con un plano
   corto de las manos de Javier y Laura (sembrando, sosteniendo la copa, cerrando una válvula, plantando la última
   semilla). En la boda, las manos de verdad se juntan y la constelación brilla entera.
2. **Los dos surcos.** C01 empieza con dos surcos y C10 vuelve a ellos. La boda empieza
   en el mismo valle del prólogo, ya florecido, y de ahí la cámara llega a la Casa Eterna.
3. **Elegir.** Toda la campaña repite que nadie queda obligado: Ofelia elige, Eneas elige si renacer, Elián elige salir
   de la casa perfecta, P23 elige no quedarse con una estrella ajena. La boda cierra ese hilo: el amor no es una
   cadena, es **una elección que se vuelve a hacer siempre**. Así la frase de Javier no rompe el canon («no se promete
   inmortalidad a la pareja»): no promete vivir para siempre, promete elegirla en cada vida.

**Cómo encaja la frase de la boda con el lore:**
- **«Cuántos ciclos pasen»**: Lara guía a cada alma y en Verdia se puede elegir renacer (la escena de Eneas lo
  presenta).
- **«Cuántos universos o mundos visitemos»**: Astra es el mar de estrellas entre los planos de todos los panteones (lo
  revelan las escenas de Sangre y Ceniza y la de S08).
- **«En qué planeta vivamos»**: P23 se llama «La estrella que no será nuestra casa» y C09 «Una estrella sin dueño».
  Ahí deciden no quedarse con un mundo ajeno, porque su hogar es el uno para el otro.

---

## 2. Arreglos de coherencia (**hechos** el 12 de octubre de 2026)

| # | Choque | Qué se hizo |
|---|---|---|
| 1 | **El Conde terminaba en Nox dos veces** (granja P09 y final de Sangre y Ceniza). | Ya estaba amarrado en el motor: P04, P06, P08 y P09 piden cruzar la puerta del sector de Sangre (`tipo: 'sangre'`, `historia.ts`). Es **el mismo momento** contado en los dos juegos. Al animarla, C04 «La copa» será una sola película: sale donde ocurra primero y en el otro queda para volver a verla. |
| 2 | **Las diosas tenían dos voces distintas.** | Una sola voz por diosa en todo el juego, la del prólogo (`astra-reparto.json` apunta a `cine-reparto.json`). Se rehicieron las 7 líneas de Celia, Aura y Lara en las escenas de la campaña (481 caracteres). |
| 3 | **Fuatia no sonaba celestial.** | Sus 127 líneas pasaron al mismo sonido «suave» sin gastar créditos (`voces-astra.mjs celestial` reprocesa lo que ya había). El filtro vive en un solo lugar: `scripts/granja-v3/filtro-celestial.mjs`. |
| 4 | **Las Santas no tenían nombre en Sangre y Ceniza.** | Ahora son **Serena** (Santa de Lara) y **Eliana** (Santa de Aura) en Sangre y Ceniza (pareja y amigos), en el pueblo de la granja y en la carta de la campana. Serena ya no dice que el manuscrito lo escribieron «sus hermanas hace siglos» (la biblia dice que no tiene recuerdos de siglos): lo escribieron las Santas de antes. |
| 5 | **Fuatia aparecía sin presentación.** | C11 tiene su entrada de 20 s con dos líneas nuevas (`narrativa/10-figuras-y-escenas.md`), escritas para no correr la numeración de las líneas que ya tienen voz. |
| 6 | **La boda no era canon.** | Quedó en `narrativa/02-campana.md` («Desenlaces»): escena, no decisión del jugador; los votos prometen elegirse en cada ciclo, no inmortalidad; no está en la versión de amigos. |
| 7 | **«Quién cuenta qué».** | Fila nueva en `la-pareja.md` para la película de Astra; el misterio por mesa sigue siendo de la cama. |
| 8 | **Los amigos.** | Las escenas nuevas de Sangre y Ceniza llevan versión de amigos; la boda, el Altar y lo de la pareja nunca entran (revisado con `verificar-amigos`). |

---

## 3. La película completa, en el orden en que se vive

Estados: **hecho** = ya animada; **guion** = guion completo escrito (falta animar); **base** = hay texto o una misión de
donde sale, pero falta escribir el guion de película; **nuevo** = hay que escribirlo desde cero.

Granja = misión de la campaña; Sangre = puerta del mapa de la Noche; Casa = el Hogar.

### Prólogo
| # | Escena | Sale en | Dur. | Guion | Voces | Música |
|---|---|---|---|---|---|---|
| 0 | **El nacimiento de Celia** | Partida nueva de la granja | 2 min | hecho | hechas (10) | M12 + M13 |

### Acto I · Lo que parecía un surco
| # | Escena | Sale en | Dur. | Guion | Voces | Música |
|---|---|---|---|---|---|---|
| 1 | **C01 Dos surcos** | Granja P01 | 80 s | guion | hechas (12) | M01 |
| 2 | **C11 El agua que escucha** (+ entrada de Fuatia) | Granja F01 | 2-3 min | guion (+20 s nuevo) | hechas (20) + 2 nuevas | M23 |
| 3 | **SC0 La Noche Eterna**: el Conde bebe la ceniza, se abre la grieta, la constelación parpadea | Sangre: primera vez en el mapa (↔ granja P02) | 70 s | base (`historia_pareja.ts`) | nuevas (~8) | La de Sangre |
| 4 | **C02 La campana y la mesa** | Granja P03 | 110 s | guion | hechas (13) | M10 |
| 5 | ★ **Eliana, «El brote que puede esperar»**: la Santa de Aura deja el rito vistoso por la comida del pueblo; Aura aparece y la respalda. Respiro alegre (Fiesta del Despertar Dorado) | Su misión personal | 60 s | base (reparto) | nuevas (~8) | M02 |
| 6 | **SC1 Las Afueras**: Serena no alcanza las almas de Valdemora; primer grifo de la Campana de Extracción | Sangre sector 1 (↔ granja P04) | 80 s | base | nuevas (~10) | La de Sangre |
| 7 | **C03 La firma** | Granja P05 | 2 min | guion | hechas (13) | M09 |

### Acto II · La Noche prestada
| # | Escena | Sale en | Dur. | Guion | Voces | Música |
|---|---|---|---|---|---|---|
| 8 | **SC2 El fuego bajo la piedra**: la Mina Profunda de los dragones, La Cría. **Misterio 1**: Aura y Lara ven a Nath'Gora apagar el plano de otro panteón; por eso el escudo | Sangre sector 2 (↔ granja P06) | 90 s | base | nuevas (~10) | La de Sangre |
| 9 | ★ **T03 La cría que no quiere hablar**: una cría mítica de Celia y el cuidado sin dueño (tierno, con unicornio y Fuatia) | Granja, Fuatia T03 | 60 s | base | nuevas (~7) | M01 |
| 10 | **SC3 El Santuario roto**: la abadía que «reza, pero a otro». **Misterio 2**: los panteones y las prisiones de Vael'Thor (las Reliquias de Sangre) | Sangre sector 3 (↔ granja P08) | 90 s | base | nuevas (~10) | La de Sangre |
| 11 | **C04 La copa**, compartida. **Misterio 3**: el Lazo Primordial (Javier y Laura). Lara sella al Conde en Nox | Granja P09 y final de Sangre | 2,5-3 min | guion (+ Misterio 3) | hechas (16) + ~4 | M11 |
| 12 | **C05 Una mañana que no basta** | Granja P10 | 100 s | guion | hechas (10) | M08 |
| 13 | **SC4 El descenso**: Nath'Gora mira la constelación desde el abismo; sigue suelto y va por la granja (escena después de los créditos de Sangre) | Sangre: abre El descenso | 40 s | nuevo | nuevas (~3) | La de Sangre |

### Acto III · El refugio con dueño
| # | Escena | Sale en | Dur. | Guion | Voces | Música |
|---|---|---|---|---|---|---|
| 14 | ★ **S08 La ayuda que no llegó**: un panteón manda homenajes en vez de ayuda y la estrella de Nath'Gora se apaga. La tragedia del villano | Granja, secreto S08 (después de P13) | 70 s | base | nuevas (~8) | M15 |
| 15 | **C12 El día posterior al nacimiento** | Granja F04 | 3 min | guion | hechas (21) | M23 |
| 16 | ★ **Eneas, «Lo que no vuelve idéntico»**: en Verdia, un alma que se pregunta si renacer. **Aquí nace la idea de los ciclos** de la boda | Su misión personal (Verdia) | 70 s | base | nuevas (~8) | M12 |
| 17 | ★ **Ofelia, «La casa que dejé esperando»**: repara su promesa en Senda y sube a Verdia de la mano de Lara (el ascenso más bonito del juego) | Su misión personal (Senda) | 80 s | base | nuevas (~9) | M13 |
| 18 | **C06 La casa de Elián** | Granja P15 | 2,5-3 min | guion | hechas (16) | M14 |
| 19 | ★ **Serena, «El nombre que no se pronuncia por otro»**: la Santa de Lara acompaña una despedida; Lara aparece con su velo | Su misión personal | 60 s | base | nuevas (~7) | M16 |

### Acto IV · Un pacto que admite límites
| # | Escena | Sale en | Dur. | Guion | Voces | Música |
|---|---|---|---|---|---|---|
| 20 | **C13 El precio de una alianza** | Granja F06 | 3 min | guion | hechas (20) | M23 |
| 21 | **C14 La cuenta que ya no se cierra sola** | Granja F12 | 3-4 min | guion | hechas (20) | M23 (mejor una propia) |

### Acto V · La vasija abierta
| # | Escena | Sale en | Dur. | Guion | Voces | Música |
|---|---|---|---|---|---|---|
| 22 | **C07 El tratado** | Granja P21 | 2 min | guion | hechas (12) | M21 |
| 23 | **C08 El ceramista** | Granja P22 | 2 min | guion | hechas (13) | M22 |
| 24 | **C09 Una estrella sin dueño**, la batalla del Borde de Astra (ver el tower defense) | Granja P23 | 2,5-3 min | guion | hechas (14) | M19 |
| 25 | **C10 La parcela de mañana** | Granja P24 | 90 s | guion | hechas (11) | M20 |

### Epílogo · El Hogar
| # | Escena | Sale en | Dur. | Guion | Voces | Música |
|---|---|---|---|---|---|---|
| 26 | **El Altar del Lazo**: las reliquias de la granja y de Sangre y Ceniza encienden el altar de la casa y la constelación se dibuja sobre el techo. Celia, Aura, Lara y Fuatia anuncian la boda | Casa: al completar el Altar (P24 + final de Sangre + F12) | 60 s | nuevo | nuevas (~6) | Por definir |
| 27 | **★ «Siempre te elegiré», la boda** | Casa, después del Altar | 3-4 min | nuevo (borrador abajo) | nuevas (~8; Javier en off, Laura no habla) | Compuesta o CC0 |
| — | **Créditos** con las fotos de las 27 escenas y «Feliz aniversario» | Al terminar la boda | 1,5 min | nuevo | — | La de la boda |

★ = misión secundaria con escena propia (6). Son las que tienen más peso emocional y, además, explican piezas que la
boda necesita: los ciclos (Eneas, Ofelia), el villano (S08), las diosas de cerca (Eliana, Serena) y las criaturas (T03).

**Totales:** 28 escenas, unos **55 minutos** de película (más las presentaciones de los lugares del capítulo 6 bis,
unos 14 minutos). Hecho: 1. Con guion completo: 14. Con base para escribir: 10.
Nuevas desde cero: 3 (SC4, el Altar y la boda).

---

## 4. La boda: «Siempre te elegiré»

**Decidido con Javier:** sin votos. Ni Javier ni Laura recitan votos en la ceremonia. Lara oficia. La frase que pidió
Javier («sin importar cuántos ciclos pasen…») **no es un voto**: es la última línea de toda la película, dicha por Javier
en voz en off sobre el último plano, ya terminada la boda (decisión de Claude; si no le gusta, la dice el narrador).

**Dónde: Eterna, casa boutique en Sopetrán** (el lugar donde quieren la boda real; se vio la página de Wink Eventos y
sus fotos, que no se suben al repositorio). Lo que se modela en Blender, en el estilo del juego (peluche, fieltro y
madera, formas redondeadas):
- **El pabellón**: una construcción blanca y moderna de techo plano, con vigas negras, un tragaluz cuadrado con
  enredaderas que cuelgan y lucecitas en el techo. Ahí va la mesa larga de la fiesta, con velas blancas altas, calas y
  rosas blancas, y la torta blanca.
- **Las cabañas**: casitas en A con frente de madera y techo gris oscuro, entre los árboles (ahí se hospedan los
  invitados).
- **El jardín**: tropical y frondoso (platanillos, palmas, hojas grandes), un árbol enorme de tronco claro y ramas
  abiertas con musgo, y la piscina con jacuzzi y asoleadoras.
- **La ceremonia**: un **arco de rosas blancas** sobre el pasto, junto a la piscina, con el monte detrás. Los invitados
  en sillas a los lados del camino.
- **El río**: dos decks de madera junto a un río natural, y la **fogata**. Ahí cierra la noche.

**Quiénes:** Javier (traje azul noche con moño) y Laura (vestido blanco con velo largo), ropa nueva para el clóset de
Blender. Celia, Aura, Lara y Fuatia. Las Santas Eliana y Serena. Los vecinos que el jugador ayudó (Elián, Ofelia y
Eneas bajan de Verdia si viste su escena). Un unicornio, un dragón y un grifo.

**Planos (3-4 min):**
1. **La llegada** (20 s): la cámara baja desde la Constelación de los Amantes, pasa sobre el valle del prólogo ya
   florecido y llega a Eterna al atardecer: el río, las cabañas, el pabellón iluminado. Los vecinos llegan con faroles.
2. **Los regalos de las diosas** (40 s): Celia hace florecer el arco de rosas desde la tierra; Aura enciende las velas
   del camino con una sola chispa que va saltando; Fuatia junta fuego, agua, tierra y aire en **un lazo de cuatro
   hilos**; el grifo trae el velo de Laura volando.
3. **Laura entra** (25 s): camina sola por el camino de velas; Javier, en el arco, no sabe qué hacer con las manos
   (un detalle chistoso, como él). Sin diálogo, solo la música.
4. **Lara oficia** (50 s): se quita el velo por primera vez en todo el juego. Ata el lazo de cuatro hilos en sus manos.
   Habla ella; ellos solo se miran.
5. **La constelación** (20 s): las manos se juntan, el lazo brilla y la Constelación de los Amantes se enciende entera
   sobre Eterna. Un pulso de luz recorre el escudo del mundo: ya no se puede romper.
6. **La fiesta** (40 s): la mesa larga del pabellón, el baile lento, el dragón calienta la fogata, el unicornio se come
   las flores del centro de mesa, los vecinos brindan.
7. **El río** (30 s): ya tarde, los dos solos en el deck junto a la fogata, mirando la constelación. Javier en off dice
   la frase. Fundido a blanco.
8. **La mañana siguiente** (15 s): los dos en la parcela. «¿Y mañana?» «Miramos si brotó» (la frase de C10). Créditos.

**Líneas** (sin votos; lo romántico es de Javier, que lo corrige si quiere):

> **Lara:** He tomado de la mano a cada alma de este mundo cuando terminó su tiempo. Y en cada ciclo, sin falta, los vi a
> ustedes dos buscarse.
>
> **Aura:** Y cada vez que se encontraron, el fuego volvió a encenderse. No porque yo lo prendiera: porque ustedes lo
> eligieron.
>
> **Celia:** Esta tierra nació de mis manos. Este lazo nació de las suyas.
>
> **Fuatia:** Lo que se elige libremente pesa más que cualquier juramento. Fuego, agua, tierra y aire: los cuatro son
> testigos.
>
> **Lara:** Entonces no les pido promesas. Ya se eligieron. Vayan juntos.
>
> **Narrador:** Y la Constelación de los Amantes brilló entera sobre la casa. Desde esa noche, ninguna ceniza volvió a
> encontrar por dónde entrar.
>
> **Javier** *(en off, junto al río)*: Laura… sin importar cuántos ciclos pasen, cuántos universos o mundos visitemos, ni
> en qué planeta nos toque vivir… siempre te voy a elegir a ti.

**Voces:** Javier, con su voz clonada («EL», `docs/sistemas/voces.md`); Laura no habla. Las diosas con sus voces de
siempre y el sonido celestial suave; el narrador, Josué Maya.

**Música:** primero se busca una pieza gratuita (CC0) romántica y orquestal para la ceremonia y otra cálida para la
fiesta; si ninguna está a la altura, se compone una con un tema que vuelve en los créditos.

---

## 5. Sangre y Ceniza: cómo se profundiza su historia

Hoy tiene cinco escenas cortas de texto con ilustración, que salen al cruzar las puertas del mapa de la Noche. La
propuesta:

1. **Las cinco escenas pasan a ser películas** (SC0-SC3 y C04) con el mismo motor, en el castillo, la mina, la abadía y
   el cementerio, que ya están modelados para el juego. La versión de amigos cuenta lo mismo sin nombrar a la pareja.
2. **Una sexta, SC4 «El descenso»**: Nath'Gora sigue suelto. Une el final de Sangre con el Acto III de la granja.
3. **Lo que falta contar** (para que la historia se sienta profunda y no solo de fondo):
   - **El Conde humano**: la copa sencilla de su juventud y su miedo a morir (está en la biblia, no en el juego). Se
     cuenta en C04 y con **páginas del diario del Conde**, una por bioma, que se recogen en las expediciones (texto,
     sin voz; una por lugar del mapa).
   - **Los jefes hablan**: una línea con voz al aparecer cada jefe (la Abadesa, el Obispo Hueco, el Gusano, La Cría y
     el Conde en sus dos fases). Unas 12 líneas.
   - **El grifo de la Campana**: el modelo de la campana ya está pendiente de llevar su grifo (mitología, sección 3).
     Que se vea bajar en la extracción une el juego con el mito sin una escena aparte.
4. **El orden con la granja** (el arreglo 1 de la tabla del capítulo 2): para hacer P04, P06, P08 y P09 hay que haber
   cruzado su puerta en Sangre. Así la historia de los dos juegos avanza a la par, sin contradicciones.

---

## 6. Los cuatro minijuegos nuevos (solo lo que necesitan; se hacen después)

Decidido: **peleas y carreras** son casuales y se juegan también en la **Sala de Juegos** (la app de amigos, sin nada de
la pareja). **El tower defense** es la batalla de la misión 23, pero se juega cuando quieras desde el **Cuarto de
Juegos** de la casa. **El del celular** tiene **entre 5 y 10 casos, todos completos**.

| Juego | Dónde cae en el lore | Animaciones | Voces | Amigos |
|---|---|---|---|---|
| **Peleas tipo Street Fighter / Smash**: «El Torneo del Despertar Dorado» | Casual. El torneo de la Fiesta del Despertar Dorado, con muñecos de peluche. | Por luchador: entrada, 4-6 golpes, especial, victoria y derrota; escenarios del pueblo, Brasaviva y Nieveclara. | Unas 8 frases por luchador (Javier, Laura, las Santas, vecinos; el Conde y Vael'Thor como «máscaras de feria») y un presentador. | Sí, en la Sala de Juegos, con luchadores neutros |
| **Carreras tipo Mario Kart**: «La Carrera de las Tres Lunas» | Casual. Pistas por las regiones de Astra; carros tirados por criaturas. | Carros y personajes al volante, objetos, podio. | Presentador y unas 5 frases por corredor. | Sí, en la Sala de Juegos |
| **El celular**: «Desaparecidos de Astra» | De lore. Cada caso es un celular encontrado en un lugar de Astra: mensajes, fotos, notas de voz y contraseñas para saber qué pasó y dónde está la persona. **Nunca la desaparecida es Laura.** | Interfaz del teléfono, fotos renderizadas de lugares que ya existen y una escena corta al cerrar cada caso. | Notas de voz: unas 25 líneas por caso. | Sí: ningún caso es de la pareja |
| **Tower defense**: «El Escudo de las Hermanas» | De lore: la defensa del Borde de Astra en P23 (empalma con C09). Torres: altares de Aura y de Lara, dragones, grifos, unicornios y los elementos de Fuatia; enemigos: la ceniza de Nath'Gora. | Torres, enemigos y un mapa por nivel; escena de 30 s al empezar y al final. | Narrador, las Santas y Nath'Gora (unas 25 líneas). | En el Cuarto de Juegos siempre; en la Sala de Juegos, sin nombrar a la pareja |

**Los casos del celular (propuesta de 8; cada uno completo: desaparición, pistas, giro, final y su escena):**

| # | Caso | Dónde | De qué trata |
|---|---|---|---|
| 1 | **La noche del pacto** | Valdemora | Una criada del castillo desapareció la noche en que el Conde bebió la ceniza (AV 301). Su teléfono cuenta los últimos días del Conde humano y la copa de su juventud. Está viva, en Vigilia. |
| 2 | **El faro que no encendió** | Puerto de los Lirios | El farero no prendió el faro la noche de la Fiesta de las Barcas. Se fue a buscar a una barca perdida, solo. |
| 3 | **La cota tres** | Piedralumbre | Una minera entró a la galería cerrada siguiendo un ruido. Los dragones de Celia la tienen guardada (y la cuidan). |
| 4 | **La niña del Eco** | Jardines del Eco | Un alma que se quedó entre Senda y Verdia: uno de los laberintos de Vael'Thor que nadie desarmó. |
| 5 | **El astrónomo de Nocturna** | Vigía de Nocturna | Anotaba una estrella que se mueve sola; sus notas llevan a la luna manchada. |
| 6 | **La ruta del carro de agua** | Ambarina | El repartidor de agua dejó el carro en mitad del desierto con el agua intacta. |
| 7 | **Un concierto que se vea** | Iridalia | Una música sorda desapareció antes de su concierto; el caso se resuelve con lo que se ve, no con lo que se oye. |
| 8 | **El último turno** | Estación sobre Celia | Un técnico no regresó de una salida al casco; su bitácora y las cámaras no coinciden. |

---

## 6 bis. Las presentaciones de cada lugar (pedido de Javier)

Al llegar por primera vez a un mundo, pueblo o bioma sale una animación corta que lo presenta bonito: la cámara recorre
el lugar, aparece su nombre y el narrador dice qué es, quién vive ahí y qué misiones principales van a pasar ahí. Se
salta con un toque, sale una sola vez y se vuelve a ver desde el mapa. Se hacen con el mismo motor de las películas y
con los modelos que ya existen de cada lugar, así que salen mucho más baratas que una película.

**Dos tamaños:**
- **Llegada a un mundo** (35-45 s): un plano grande desde el cielo, el lugar en el mito y los que mandan ahí. Son 6:
  la Frontera (Vigilia y Valdemora), Verdia, Senda, Nox, el cielo de Astra (la Estación y las lunas) y Confluencia. El
  valle de Celia ya tiene el prólogo.
- **Postal de un lugar** (12-20 s): un vuelo por la calle principal, su hito, dos o tres vecinos haciendo su oficio, el
  letrero con el nombre y una línea del narrador.

| Mundo | Lugares con postal | Llegada | Música |
|---|---|---|---|
| Valle de Celia | Pueblo del Sol, Cruce del Valle, Puerto de los Lirios, Brumaverde, Piedralumbre, Brasaviva, Nieveclara | (el prólogo) | La de cada lugar |
| Frontera | Vigilia de Ceniza | Sí | M08 |
| Verdia | Rosal Eterno, Jardines del Eco | Sí | M12 |
| Senda | Umbral de la Travesía, Refugio de los Hilos | Sí | M13 / M14 |
| Nox | Bastión del Velo | Sí | M15 |
| Cielo de Astra | Estación sobre Celia, Huerto de Aurelia, Vigía de Nocturna, Cantera de Esmeralda, Campamento de los Fragmentos, Asteroide Cobrizo, Asteroide Prisma, Ambarina, Iridalia, Borde de Astra | Sí | M16-M19 |
| Confluencia | Refugio de Confluencia, Caldera del Rescoldo, Mar de los Retornos, Terraza de las Raíces, Altura de las Corrientes | Sí | M23 |
| Sangre y Ceniza | El Cementerio Hundido, Las Catacumbas, Las Minas de Sangre, La Abadía en Llamas, El Castillo del Conde | (la llegada es SC0) | La de Sangre |

Son **6 llegadas y 33 postales** (unos 14 minutos en total). La boda tiene su propia llegada (la Casa Eterna) dentro de
su película. Voces: 1 a 3 líneas del narrador por lugar, unas 100 líneas (≈ 7.000 caracteres). Las de Sangre y Ceniza
llevan su versión de amigos.

---

## 7. Lo que cuesta en voces y música

- **Voces nuevas**: unas 140 líneas, contando las de los jefes (≈ 14.000 caracteres) más un margen para repetir tomas: unos **20.000
  caracteres**. Hoy quedan ≈ 51.000 de 243.000 y el cupo se renueva el **28 de octubre**. Con las presentaciones de los lugares (≈ 7.000 más) son unos **27.000 caracteres**: alcanza
  con lo que queda hoy y el cupo nuevo del 28 de octubre. Lo de los minijuegos queda para después.
- **Unificar las diosas** (arreglo 2): **hecho**, 481 caracteres. Fuatia (arreglo 3): **hecho**, gratis.
- **Música** (como pidió Javier: primero gratuita y, si no hay nada adecuado, compuesta):
  - Las escenas de la granja ya tienen su pieza (las M de `musica.md`). Sangre y Ceniza usa la suya.
  - **La boda**: primero se busca una pieza CC0 romántica y orquestal; si ninguna tiene la altura del final, se compone
    una (con un tema que vuelva en los créditos, unos 5 min ≈ 3.500 créditos).
  - **C11 a C14** comparten M23. Se les busca una pieza gratuita a cada una (o como mínimo una aparte para C14, que es
    el cierre de Fuatia).

---

## 8. En qué orden se hace

Ver las fases del capítulo 12 (A a H). Los arreglos de coherencia ya están hechos.

---

## 9. Decisiones de Javier (12 de octubre de 2026)

| # | Pregunta | Decidido |
|---|---|---|
| 1 | ¿Qué dice Laura en la boda? | **Nada: sin votos.** Laura no habla; responde con gestos |
| 2 | ¿Dónde es la boda? | **Eterna**, casa boutique en Sopetrán (descrita en el capítulo 4 a partir de sus fotos) |
| 3 | ¿Quién oficia? | **Lara** |
| 4 | El tower defense | La batalla de **P23**, y se juega cuando quieras desde el **Cuarto de Juegos** |
| 5 | El juego del celular | Lo decide Claude: **8 casos** de lore, todos completos (el primero, la sobreviviente de Valdemora) |
| 6 | Peleas y carreras | Casuales, y se juegan también en la **Sala de Juegos** |
| 7 | Las 6 escenas secundarias | **Aprobadas** las seis |
| + | Presentaciones de cada lugar | **Incluidas en el plan** (capítulo 6 bis) |

**Lo que falta de Javier:** nada para empezar. Solo, cuando quiera, revisar las líneas de la boda (capítulo 4).

---

## 10. Las escenas que faltan por escribir, plano a plano

Las 14 cinemáticas ya tienen guion (`narrativa/02-campana.md` y `10-figuras-y-escenas.md`). Estas son las 13 que no,
con su esqueleto: lo que pasa, lo que se ve y la idea con que se queda el jugador. Los diálogos se escriben sobre esto
al empezar cada acto (con versión de amigos en las de Sangre y Ceniza).

**SC0 · La Noche Eterna** (70 s, Sangre: primera vez en el mapa). El castillo de Valdemora en AV 301, todavía con luz. El
Conde enfermo, solo, con la copa sencilla de su juventud. Una voz fría desde las estrellas le ofrece no morir nunca.
Bebe la ceniza: la luna se mancha, cae la Noche Eterna y en el cielo la Constelación de los Amantes parpadea. Corte a
Javier y Laura que la miran desde el Hogar. *Idea: alguien abrió la puerta desde adentro, por miedo.*

**SC1 · Las Afueras** (80 s, puerta del sector 1). El cementerio en niebla. Serena intenta guiar a un alma y su mano la
atraviesa: la ceniza le tapa el camino. Encuentran la grieta, una herida de luz negra en el borde del escudo. Suena la
Campana de Extracción y baja el primer grifo por el haz de Aura. *Idea: las almas no se pierden, las tapan.*

**SC2 · El fuego bajo la piedra** (90 s, sector 2). La Mina Profunda: dragones de piedra dormidos y La Cría que los
defiende. Serena enciende el manuscrito y se ve el **Misterio 1**: Aura y Lara, hace siglos, ven a Nath'Gora apagar el
plano de otro panteón como quien sopla una vela; luego miran a Celia recién nacida y levantan el escudo. *Idea: el escudo
no fue por si acaso.*

**SC3 · El Santuario roto** (90 s, sector 3). La abadía en llamas: monjes que rezan, pero a otro. Bajo el altar, el
manuscrito de las Santas. **Misterio 2**: Vael'Thor encerrando la esencia de los dioses en geometrías oscuras; las
Reliquias de Sangre son astillas de esas prisiones. Al levantar una, se oye un dios dormido. *Idea: cada reliquia es
alguien que espera.*

**C04 · La copa** (ya escrita) + **Misterio 3**: antes de que Lara selle al Conde, Serena explica el Lazo Primordial y
la constelación se dibuja sobre las manos de Javier y Laura. Se escribe en la biblia como una ampliación de C04.

**SC4 · El descenso** (40 s, después de los créditos de Sangre). El abismo de Astra. Nath'Gora, de espaldas, junto a una
estrella apagada. Mira la constelación sobre el Hogar. «Todavía no.» *Idea: lo de la granja sigue.*

**Eliana · El brote que puede esperar** (60 s). La Fiesta del Despertar Dorado. Eliana prepara un rito enorme y vistoso;
una familia cansada solo necesita comida. Ella guarda el rito y reparte pan de miel. Aura aparece entre las fogatas, se
ríe y le prende una sola llamita en la mano. *Idea: cuidar también es no imponer.*

**T03 · La cría que no quiere hablar** (60 s). Una cría de unicornio escondida en el corral, con miedo a los visitantes.
Javier y Laura sacan a los curiosos y se sientan lejos. Fuatia mira sin intervenir. La cría se acerca sola, al final.
*Idea: el cariño no se compra ni se fuerza.*

**S08 · La ayuda que no llegó** (70 s). Un recuerdo antiquísimo, en papel animado: un ser frío cuida una estrella que se
apaga y pide ayuda a un panteón; el panteón le manda coronas y homenajes en vez de ayuda. La estrella muere en sus manos.
Así nació Nath'Gora. *Idea: el villano también perdió algo; eso no lo justifica.*

**Eneas · Lo que no vuelve idéntico** (70 s). Verdia. Eneas cuida un rosal y confiesa que quiere renacer, pero le da
miedo que sea abandonar a los suyos. Lara le explica los ciclos: se vuelve distinto, pero lo que uno ama sabe
reconocerse. Eneas no decide todavía. *Idea: los ciclos (prepara la frase final de la boda).*

**Ofelia · La casa que dejé esperando** (80 s). Senda. Ofelia termina por fin, en recuerdo, la casa que dejó a medias.
No pide perdón: repara. El camino de Senda se abre en escalones de luz y Lara la toma de la mano hacia Verdia. *Idea:
reparar no es comprar el perdón.*

**Serena · El nombre que no se pronuncia por otro** (60 s). De noche, Serena acompaña a una anciana que se va. No
promete que no duela; se queda. Lara aparece con el velo, la toma de la mano y se van despacio. Serena llora tranquila y
apaga la vela. *Idea: acompañar no es resolver.*

**El Altar del Lazo** (60 s, casa). Las reliquias de la granja y de Sangre y Ceniza llegan al altar de la casa y lo
encienden; sobre el techo se dibuja la constelación. Celia, Aura, Lara y Fuatia aparecen en el patio: «Hay algo que
todavía no han celebrado». Corte a negro: invitación a la boda.

**Llegadas a un mundo** (6, de 35-45 s; capítulo 6 bis). Cada una: plano desde el cielo, qué es en el mito, quién manda
ahí y el letrero del mundo. Frontera (la grieta y Vigilia), Verdia (los Cuidadores y la luz dorada), Senda (los
caminos de prueba), Nox (el foso fuera del ciclo, visto desde el Bastión), el cielo de Astra (la Estación y las tres
lunas) y Confluencia (los cuatro elementos girando).

---

## 11. Lo que hay que modelar en Blender (regla de la granja: todo en Blender)

| Para | Modelo | Estado |
|---|---|---|
| Diosas | Celia, Aura y Lara (muñeco de Ella con `ropa_diosas.py`) | **Hecho** |
| Diosas | **Fuatia**: vestido de cuatro colores, corona de los cuatro elementos y la figura de luz para su entrada | **Hecho** (`ropa_cine.py`) |
| Diosas | Lara **sin velo** (la boda) | **Hecho** (diadema) |
| Villanos | **Nath'Gora** y **Vael'Thor** como actores | **Hecho** (corona de esquirlas y máscara de porcelana) |
| Villanos | El Conde | Hecho (jefe de Sangre); falta el **Conde humano** con la copa, antes del pacto |
| Criaturas | Dragón, grifo y unicornio de la granja; la **cría de unicornio** (T03, `granja_cria.py`) | **Hecho** |
| Gente | Serena, Eliana, Eneas, Ofelia, Elián y los vecinos | Hechos como habitantes de Astra; revisar que tengan cara para planos cercanos |
| Lugares | Valle, pueblo, regiones de Astra y biomas de Sangre | **Hechos** (`granja_*.glb`, `sangre/bioma_*.glb`) |
| Lugares | El cosmos (estrellas, planeta, escudo) | Hecho en el motor (prólogo) |
| Boda | **Eterna**: pabellón, cabañas en A, piscina, árbol grande, arco de rosas, río con decks, fogata, mesa larga | **Hecho** (`granja_eterna.py`) |
| Boda | Traje y vestido de boda, velo, lazo de cuatro hilos, faroles, velas, calas | Falta |
| Casa | **El Altar del Lazo** (también se usa en el juego de la casa) | Falta |
| Papel animado | Láminas para S08 y los recuerdos de C08 | Falta (se pintan con texturas) |

---

## 12. Fases (cada una se prueba con capturas, se sube y la APK sale en verde)

| Fase | Qué | Entrega |
|---|---|---|
| A | Guiones del Acto I (SC0, Eliana, SC1) y la entrada de Fuatia; voces del Acto I | Javier oye las voces antes de animar |
| B | Actores que faltan del Acto I: Fuatia y el Conde humano | Hoja de contacto de los modelos |
| C | **Acto I animado**: C01, C11, SC0, C02, Eliana, SC1, C03 + llegada a la Frontera y postales del valle | Video corto de cada escena |
| D | Acto II: SC2, T03, SC3, C04 compartida (+ Misterio 3), C05, SC4 + postales de Sangre | Ídem |
| E | Acto III: S08, C12, Eneas, Ofelia, C06, Serena + llegadas a Verdia, Senda y Nox | Ídem |
| F | Actos IV y V: C13, C14, C07, C08, C09, C10 + llegadas al cielo de Astra y Confluencia | Ídem |
| G | El Altar del Lazo, **Eterna**, la ropa de boda, **la boda** y los créditos | La película completa de punta a punta |
| H | Los minijuegos (cada uno por su lado, cuando Javier lo pida) | — |

**Estado (13 de octubre de 2026):**
- **Fase A hecha y más**: Javier pidió aprovechar el descuento de V4, así que se escribieron y grabaron **todas** las
  voces que faltaban de la película (168 líneas: Sangre y Ceniza, la entrada de Fuatia, las seis secundarias, el Altar,
  la boda, los jefes y los 39 lugares) y se compuso la música de la boda (ceremonia, fiesta y créditos). Las 7 líneas de
  las diosas y las 127 de Fuatia quedaron con el sonido celestial suave.
- **Fase C (Acto I) animada**: C01, C11 (con la entrada de Fuatia), SC0, C02, Eliana, SC1 y C03. Fuatia y el Conde se
  armaron con el clóset que ya había (vestido de diosa en los colores de los cuatro elementos; el Conde con traje de
  monarca, corona y capa); los modelos propios de la fase B siguen pendientes.
- Acto I completo en el juego: presentaciones de lugares (`postal.ts`), SC0 y SC1 en el mapa de la Noche, Eliana al
  cerrar su historia.
- **Fase D (Acto II) animada**: SC2, T03, SC3, C04 (con el Lazo; la misma en la granja y en Sangre), C05 y SC4.
- **Fase E (Acto III) animada**: S08 (papel animado), C12, Eneas, Ofelia, C06 y Serena.
- **Fase F (Actos IV y V) animada**: C13, C14, C07, C08, C09 y C10. Las 14 cinemáticas ya son película.
- **Fase G animada**: Eterna modelada en Blender, la ropa de boda, el Altar del Lazo (ALT) y la boda completa (BOD)
  con créditos. Se dispara en la granja al cerrar P24 y F12 con el final de Sangre visto (`cine-granja.md`).
- **Hecho después**:
  - Las postales de los biomas dentro de Sangre (`sangre/ui/postal.ts`).
  - El Conde habla en su pelea (JEF.C1 al aparecer, JEF.C2 con las alas).
  - Las fotos de las 28 películas en los créditos (`public/granja/cine/fotos/`, sacadas con `scripts/_fotos_creditos.mjs`).
  - La cría de unicornio propia (`personajes/blender/granja_cria.py`) en T03.
  - Las piezas propias de la fase B (`personajes/blender/ropa_cine.py`): el vestido y la corona de los cuatro elementos
    de Fuatia, la corona de esquirlas con la estrella muerta de Nath'Gora y la máscara de porcelana rajada con oro de
    Vael'Thor.
- Queda: la copa del Conde humano en SC0 (hoy brinda con la mano vacía) y los minijuegos de la fase H.

Cada escena: guion → voces → actores y escenario → animación con el motor del cine (`cine-granja.ts`) → pruebas en el
navegador (cuadros sueltos y video) → captura revisada → commit y push. Las de Sangre y Ceniza llevan su versión de amigos
y pasan `verificar-amigos`.

