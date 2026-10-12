# La película de Astra (propuesta para Javier)

**Pedido del 12 de octubre de 2026.** Javier quiere que todas las escenas animadas, una detrás de otra, sean una sola
película del lore: coherente, unida y que dé gusto avanzar. Las piezas son el prólogo, las 14 cinemáticas, escenas de
Sangre y Ceniza y seis misiones secundarias con carga emocional. Al final va **la boda de Javier y Laura**, donde él
le dice que sin importar cuántos ciclos pasen, cuántos universos o mundos visiten ni en qué planeta vivan, siempre la
va a elegir a ella. También deja planeados cuatro minijuegos futuros: peleas, carreras, buscar a una persona
desaparecida en un celular y un tower defense del lore.

Este documento es **solo la propuesta**: qué escenas, en qué orden, qué guion tiene cada una y qué falta en voces y
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
2. **Los dos surcos.** C01 empieza con dos surcos y C10 vuelve a ellos. La boda es en el mismo valle del prólogo, ya
   florecido: la granja dormida del principio es el jardín de la boda.
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

## 2. Lo que hay que arreglar para que todo cuadre (encontrado al revisar)

| # | Choque | Propuesta |
|---|---|---|
| 1 | **El Conde termina en Nox dos veces**: en la granja (P09, C04 «La copa») y al final de Sangre y Ceniza (sector 4). | Es **el mismo momento**. P04, P06, P08 y P09 de la granja ya piden puertas de Sangre: los sectores 1-4 del mapa de la Noche **son** esas misiones. C04 se vuelve una película compartida: sale en el juego donde ocurra primero y en el otro queda para volver a verla. |
| 2 | **Las diosas tienen dos voces distintas**: el prólogo usa Alejandra, Valentina y Esperanza (con el efecto «suave»); las cinemáticas usaban otras (Lizy, Carolina, Malena). | Una sola voz por diosa en todo el juego: las del prólogo. Hay que rehacer solo 7 líneas (unos 480 caracteres). |
| 3 | **Fuatia** (la diosa que creó Laura) tiene voz, pero sin el efecto celestial. | Pasarle el mismo efecto «suave» a sus líneas de las películas. Se reprocesan las que ya existen: no gasta créditos. |
| 4 | **Las Santas no tienen nombre en Sangre y Ceniza** («la Santa de Lara»), pero en la biblia sí: **Eliana** (la de Aura) y **Serena** (la de Lara). | Usar los nombres en las escenas de Sangre y Ceniza. |
| 5 | **Fuatia aparece por primera vez en C11** sin una presentación a su altura. | Darle en C11 una entrada de 20 s (los cuatro elementos se juntan en una figura). Es la diosa de Laura: tiene que lucirse. |
| 6 | La biblia dice que el final «no promete inmortalidad» y que no se le pide al jugador una declaración sentimental. | La boda es una escena (no una decisión del jugador) y la frase habla de **elegirla en cada vida**, no de no morir. Hay que agregar una línea en `narrativa/02-campana.md` («Desenlaces») para que la boda sea canon. |
| 7 | «Quién cuenta qué» (`la-pareja.md`): la cama ya tiene «la boda con misterio» como sueño dicho en el chat. | La boda de la película es otra: la del mito, no la del chat. Se agrega una fila nueva para la película de Astra y no se toca el misterio por mesa (ese es de la cama). |
| 8 | Los amigos juegan Sangre y Ceniza. | Las escenas nuevas de Sangre y Ceniza llevan su versión de amigos (con «sobrevivientes», como ya hace `sangre_historia.ts`). La boda, el Altar y todo lo de la pareja **nunca** entran en la versión de amigos. |

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
| 27 | **★ «Siempre te elegiré», la boda** | Casa, después del Altar | 3-4 min | nuevo (borrador abajo) | nuevas (~25, con las voces de Javier y Laura) | Compuesta o CC0 |
| — | **Créditos** con las fotos de las 27 escenas y «Feliz aniversario» | Al terminar la boda | 1,5 min | nuevo | — | La de la boda |

★ = misión secundaria con escena propia (6). Son las que tienen más peso emocional y, además, explican piezas que la
boda necesita: los ciclos (Eneas, Ofelia), el villano (S08), las diosas de cerca (Eliana, Serena) y las criaturas (T03).

**Totales:** 28 escenas, unos **55 minutos** de película. Hecho: 1. Con guion completo: 14. Con base para escribir: 10.
Nuevas desde cero: 3 (SC4, el Altar y la boda).

---

## 4. La boda: «Siempre te elegiré» (borrador para que Javier lo corrija)

**Dónde:** el valle del prólogo, que ahora es el jardín de la granja florecido, frente a la casa, de noche. La
Constelación de los Amantes cubre el cielo. Todas las escenas acaban apuntando aquí: el prólogo empieza en este mismo
valle, dormido y lleno de maleza.

**Quiénes:** Javier y Laura con ropa de boda (traje y vestido nuevos en el clóset de Blender). Celia, Aura, Lara y
Fuatia. Las Santas Eliana y Serena. Los vecinos que el jugador ayudó (Elián, Ofelia y Eneas, que bajan de Verdia, si
completaste su escena). Un unicornio, un dragón y un grifo.

**Planos (3-4 min):**
1. Atardecer. La cámara baja desde las estrellas igual que en el prólogo (el mismo movimiento, al revés del final de
   Celia). Los vecinos llegan con faroles.
2. Celia levanta un arco de flores desde la tierra. Aura enciende las velas con su fuego. Fuatia trae los cuatro
   elementos y con ellos teje **un lazo de cuatro hilos** (fuego, agua, tierra y aire) para las manos.
3. Lara, sin velo por primera vez, oficia: es la que guía cada ciclo.
4. Los votos. Las manos se juntan y la constelación brilla entera: el escudo ya no se puede romper.
5. Fiesta corta (baile lento, los animales, fuegos de Aura) y la mañana siguiente: los dos en la parcela. «¿Y mañana?»
   «Miramos si brotó» (la misma frase de C10).

**Borrador de las líneas** (lo romántico es de Javier: lo corrige o lo reescribe él):

> **Lara:** He tomado de la mano a cada alma de este mundo cuando terminó su tiempo. Y en cada ciclo, sin falta, los vi
> a ustedes dos buscarse.
>
> **Aura:** Y cada vez que se encontraron, el fuego volvió a encenderse. No porque yo lo prendiera. Porque ustedes lo
> eligieron.
>
> **Celia:** Esta tierra nació de mis manos. Este lazo nació de las suyas.
>
> **Fuatia:** Lo que se elige libremente pesa más que cualquier juramento. Fuego, agua, tierra y aire: que los cuatro
> sean testigos.
>
> **Javier:** Laura… esposa mía, mi pulga aventurera. No sé cuántos ciclos vamos a vivir, ni cuántos universos o mundos
> nos falten por recorrer, ni en qué planeta nos toque despertar. Pero sé una cosa: en todos, siempre, te voy a elegir a
> ti.
>
> **Laura:** *(la escribe Javier: ver la decisión 1)*
>
> **Narrador:** Y la Constelación de los Amantes brilló entera sobre la casa. Desde esa noche, ninguna ceniza volvió a
> encontrar por dónde entrar.

**Voces:** las de Javier y Laura son las clonadas («EL» y «ELLA», `docs/sistemas/voces.md`). Las diosas usan sus voces
de siempre con el efecto «suave». El narrador, Josué Maya.

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

| Juego | Dónde cae en el lore | Animaciones | Voces | Amigos |
|---|---|---|---|---|
| **Peleas tipo Street Fighter / Smash**: «El Torneo del Despertar Dorado» | Casual (no avanza la historia). Es el torneo de la Fiesta del Despertar Dorado en el Pueblo del Sol, con muñecos de peluche. | Por luchador: entrada, 4-6 golpes, especial, victoria y derrota; escenarios del pueblo, Brasaviva y Nieveclara. | Unas 8 frases por luchador (Javier, Laura, las Santas, vecinos; el Conde y Vael'Thor como «máscaras de feria» que se desbloquean) y un presentador. | Sí, con luchadores neutros |
| **Carreras tipo Mario Kart**: «La Carrera de las Tres Lunas» | Casual. Pistas por las regiones de Astra (Brasaviva, Nieveclara, Iridalia, Estación Celia, Borde de Astra); carros tirados por criaturas. | Carros y personajes al volante, objetos, podio. | Presentador y unas 5 frases por corredor. | Sí |
| **Buscar a alguien desaparecido en un celular** | **De lore** (recomendado): el celular de una sobreviviente de Valdemora que desapareció la noche del pacto del Conde (AV 301). Con mensajes, fotos y notas se descubren los últimos días del Conde humano y dónde está ella (viva, en Vigilia). Une Sangre y la granja. **Nunca la desaparecida es Laura.** | Casi nada en 3D: la interfaz del teléfono y fotos renderizadas de lugares que ya existen; una escena final corta (el reencuentro). | Notas de voz de la desaparecida y de 3-4 personas más (unas 30 líneas). | La versión de amigos funciona igual (el misterio no es de la pareja) |
| **Tower defense del lore**: «El Escudo de las Hermanas» | **De lore**: la defensa del Borde de Astra durante P23 (C09), contada en unos 10 niveles. Las torres son altares de Aura (fuego) y de Lara (velo), dragones, grifos, unicornios y los cuatro elementos de Fuatia; los enemigos, la ceniza de Nath'Gora. | Torres, enemigos y un mapa por nivel; una escena de 30 s al empezar y otra al final (empalma con C09). | El narrador, las Santas y Nath'Gora (unas 25 líneas). | Sí (sin nombrar a la pareja) |

---

## 7. Lo que cuesta en voces y música

- **Voces nuevas**: unas 140 líneas, contando las de los jefes (≈ 14.000 caracteres) más un margen para repetir tomas: unos **20.000
  caracteres**. Hoy quedan ≈ 51.000 de 243.000 y el cupo se renueva el **28 de octubre**. Alcanza para todas las
  escenas sin tocar lo de los minijuegos (esas voces quedan para después).
- **Unificar las diosas** (arreglo 2): unos 480 caracteres. Fuatia (arreglo 3): gratis.
- **Música** (como pidió Javier: primero gratuita y, si no hay nada adecuado, compuesta):
  - Las escenas de la granja ya tienen su pieza (las M de `musica.md`). Sangre y Ceniza usa la suya.
  - **La boda**: primero se busca una pieza CC0 romántica y orquestal; si ninguna tiene la altura del final, se compone
    una (con un tema que vuelva en los créditos, unos 5 min ≈ 3.500 créditos).
  - **C11 a C14** comparten M23. Se les busca una pieza gratuita a cada una (o como mínimo una aparte para C14, que es
    el cierre de Fuatia).

---

## 8. En qué orden se haría (después de que Javier apruebe)

1. **Arreglos de coherencia**: unificar las voces de las diosas, el efecto de Fuatia, los nombres de las Santas y
   amarrar los sectores de Sangre con P04/P06/P08/P09.
2. **Escribir los guiones que faltan** (10 de base y 3 nuevos) en `narrativa/` y en `cine-lineas.ts`, con su versión de
   amigos donde toque. **Javier revisa la boda antes de grabar.**
3. **Animar por actos**, en el orden de la película: Acto I primero (C01, C11, SC0, C02, Eliana, SC1, C03), probando
   cada escena con capturas antes de subirla.
4. **Generar las voces** de cada acto cuando su guion esté aprobado.
5. **El Altar del Lazo y la boda**: modelos nuevos en Blender (traje, vestido, arco de flores, lazo de cuatro hilos,
   faroles), la escena y los créditos.
6. Los minijuegos, cada uno en su momento, con lo del capítulo 6.

---

## 9. Lo que tiene que decidir Javier

1. **¿Qué dice Laura en la boda?** (a) Una respuesta corta que escribes tú *(recomendado)*; (b) solo «Sí, acepto»;
   (c) no habla: solo tus votos y su sonrisa.
2. **¿Dónde es la boda?** (a) El valle del prólogo, frente a la casa, bajo la constelación *(recomendado)*; (b) la
   rosaleda de Verdia; (c) el Altar del Lazo dentro de la casa.
3. **¿Quién oficia?** (a) Lara, que guía los ciclos *(recomendado)*; (b) Fuatia, la diosa de Laura; (c) las cuatro
   diosas, una línea cada una.
4. **El tower defense**: (a) la defensa del Borde en P23 *(recomendado: no cambia el canon)*; (b) un último ataque de
   Nath'Gora la víspera de la boda, más épico pero hay que cambiar el final de la biblia.
5. **El juego del celular**: (a) la sobreviviente de Valdemora *(recomendado)*; (b) otra persona que tú propongas.
6. **Peleas y carreras**: (a) casuales, de festival *(recomendado)*; (b) con historia.
7. **Las 6 escenas secundarias** (★): ¿quitas o agregas alguna?
