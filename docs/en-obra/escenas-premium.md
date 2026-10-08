# Escenas premium

Pequeñas películas de los dos que se compran con monedas en la tienda de la casa (pestaña «Escenas») y se
lanzan en los juegos de mesa con el botón 🎭. Se ven a pantalla completa: 32 en los cuartos de la casa y 18 en
el escenario grande, donde el tablero queda chiquito en una esquina para no perder la partida de vista. En
línea, la escena sale en los dos celulares al mismo tiempo; la IA espera a que termine para jugar.

## Cómo funcionan

- **Guion** (`src/escenas/<cuarto>.ts`): tomas con tiempo; en cada una se dice qué hace cada uno (coreografía o
  pasos con pose, cara y movimiento), a dónde camina o corre, qué carga, si se sienta o se acuesta, qué dice
  (globito), el subtítulo de narrador, efectos, sonido, objetos que vuelan y partículas.
- **A** es quien lanza la escena (o quien la protagoniza si la escena es de él o de ella) y **B** el otro.
- **Cine** (`src/escenas/cine.ts`): carga el cuarto de la casa y a los dos con su ropa, mueve la cámara entre
  planos (general, los dos, uno, la cara) filmando siempre desde el lado abierto del cuarto y sin que uno tape
  al otro, con sombras, oclusión ambiental y antialias.
- **Compradas**: la casa guarda la lista en `nuestro-hogar-escenas`; en pruebas `mesa.html?todas` las abre
  todas y `mesa.html?escena=<id>` muestra una sola.

## En pausa (siguiente paso cuando se retomen)

- **Escenarios propios**: en vez de los cuartos pequeños de la casa (donde parece que dan vueltas en un
  espacio diminuto), cada escena tendrá su escenario: espacios grandes y blancos, amplios para correr,
  con solo lo necesario de utilería.
- Pestaña «Escenas» en la tienda de la casa para comprarlas (con vista previa).

## Catálogo

### Sala

| Escena | Precio | Dura | De qué se trata |
|---|---:|---:|---|
| La persecución del beso | 40 | 13.5 s | Él la persigue por la sala para darle un beso; ella corre, él se cae y llora… y ella vuelve a consolarlo. |
| El berrinche | 35 | 12 s | En la sala, el que perdió agarra el tablero y lo tira al piso con todas las fichas; el otro se muere de la risa. |
| Serenata | 45 | 13 s | Él saca la guitarra y le canta en la sala; ella, sentada en el sofá, se derrite entre corazones. |
| Ataque de cosquillas | 25 | 11 s | Uno se acerca por la espalda en puntitas… ¡cosquillas! Terminan los dos en el piso muertos de risa. |
| Foto de campeones | 35 | 10 s | Posan con el trofeo en la sala, ¡flash!, y la foto les queda de recuerdo. |
| Película de miedo | 40 | 13 s | Ven una peli de terror en el sofá con palomitas; en el susto las palomitas vuelan y terminan abrazados. |
| La siesta en el hombro | 25 | 12 s | Uno se queda dormido en el hombro del otro roncando; el otro aguanta quieto… y le pone un sombrero. |
| Karaoke desafinado | 30 | 12 s | Uno canta con el micrófono (terriblemente); el otro se tapa los oídos… y termina cantando con él. |
| La guerra del peluche | 25 | 11 s | Los dos quieren el mismo osito: jalan y jalan hasta que se caen… y el osito termina en medio de un abrazo. |
| Masaje de hombros | 25 | 11 s | Después de perder, uno se sienta rendido en el sofá y el otro le da un masaje hasta que se derrite. |
| Por fin en casa | 30 | 11 s | Uno llega cansado por la puerta y el otro corre a recibirlo, lo levanta en un abrazo y dan vueltas. |
| A las escondidas | 25 | 12 s | Uno se esconde detrás del sofá y el otro lo busca con una lupa… hasta que lo asusta. |

### Cuarto

| Escena | Precio | Dura | De qué se trata |
|---|---:|---:|---|
| Guerra de almohadas | 45 | 13 s | Un almohadazo por sorpresa y empieza la guerra: plumas por todo el cuarto hasta que caen rendidos en la cama. |
| Baile lento | 100 | 15 s | Pétalos por todo el cuarto, una flor y un baile lento sin música… hasta que uno pisa al otro. (id `la-propuesta`: la propuesta es de Cien Puertas) |
| Despertar a besos | 25 | 12 s | Suena la alarma; uno no se quiere levantar y el otro lo despierta a besos hasta que se ríe. |
| La carta | 30 | 13 s | Uno deja una carta en la almohada; el otro la lee y termina llorando de amor. |
| Cuento para dormir | 25 | 13 s | Uno lee un cuento en la cama con voces chistosas; el otro se duerme… y al final el que lee también. |
| El monstruo de la cama | 30 | 13 s | Un ruido raro en la noche, uno se esconde bajo la cobija y el otro sale a enfrentar al «monstruo»… que es el peluche. |
| Desfile del clóset | 30 | 13 s | Uno se prueba sombreros frente al clóset y desfila como modelo; el otro califica con aplausos y fotos. |
| La guerra del lado de la cama | 25 | 12 s | Los dos se acuestan y se empujan por espacio y por la cobija… hasta que terminan en el medio, abrazados. |
| ¿Qué pedimos? | 35 | 14 s | Acostados mirando el techo, discuten qué pedir de comida: «Pizza»… «¡Arepas!». (id `nombres-bebe`: el nombre de la niña es de Cien Puertas) |

### Cocina

| Escena | Precio | Dura | De qué se trata |
|---|---:|---:|---|
| Cocinando juntos | 30 | 13 s | Cocinan en la estufa: uno prueba la sopa, «¡le falta sal!», cae harina por todos lados y terminan dándose de comer. |
| El último chocolate | 30 | 13 s | Los dos abren la nevera al tiempo por el último chocolate: persecución alrededor de la mesa… y lo parten a la mitad. |
| El helado robado | 25 | 11 s | Uno disfruta su helado en la mesa; el otro se lo roba de un mordisco… y le da congelamiento cerebral. |
| Desayuno sorpresa | 30 | 12 s | Uno prepara el desayuno con flores y café; el otro llega medio dormido y se despierta de golpe de la emoción. |
| Guerra de crema | 35 | 12 s | Un pastel en la mesa, un dedo con crema en la nariz… y se desata la guerra de crema en la cocina. |
| Cena romántica | 45 | 13 s | Una cena a la luz de las velas en el comedor: brindis, miradas… y los dos comiendo del mismo espagueti. |

### Baño

| Escena | Precio | Dura | De qué se trata |
|---|---:|---:|---|
| Guerra de agua | 35 | 12 s | Uno está en la tina, el otro lo salpica… y termina adentro también, empapados de risa. |
| Caras en el espejo | 20 | 12 s | Frente al espejo, uno hace una cara chistosa, el otro la supera… y así hasta morirse de la risa. |
| El peinado loco | 25 | 12 s | Uno le arregla el pelo al otro frente al espejo… y el resultado es un desastre que terminan amando. |
| Baño de burbujas | 35 | 13 s | Un baño de burbujas juntos: se soplan burbujas, se hacen barba de espuma y terminan riendo en la tina. |
| Cepillándonos juntos | 20 | 11 s | Los dos se cepillan frente al espejo, compiten a ver quién hace más espuma… y se sonríen con la boca llena. |

### Escenario grande (el juego queda chiquito en una esquina)

| Escena | Precio | Dura | De qué se trata |
|---|---:|---:|---|
| Te dejo ganar | 20 | 11 s | El que va ganando ve al otro triste y finge perder con un drama exagerado… hasta que lo descubren. |
| El baile de la victoria | 30 | 12 s | El ganador se manda un baile épico con confeti; el otro se resiste… y termina bailando también. |
| El puchero y el chocolate | 25 | 11 s | El que perdió hace el puchero más grande del mundo; el otro le ofrece un chocolate… y se le pasa todo. |
| Me rindo… ¡sorpresa! | 30 | 12 s | El que pierde saca la bandera blanca y trae un pastel de «felicitaciones»… que termina en la cara del ganador. |
| Trampa descubierta | 30 | 12 s | Uno esconde dados de más; el otro lo investiga con lupa, lo descubre… y empieza la persecución. |
| Ninja de los dados | 25 | 11 s | Uno se vuelve ninja: pose de karate, lanza los dados por el aire… y los atrapa todos. O casi. |
| El gran mago | 35 | 13 s | Con sombrero de mago, uno hace aparecer un osito, flores… y un corazón gigante para el otro. |
| Boxeo de mentiras | 30 | 13 s | Round uno: se ponen en guardia, un golpecito de pluma… y el otro cae en cámara lenta como en las películas. |
| La gran carrera | 20 | 11 s | Una carrera a toda velocidad… sin moverse del sitio. Final de foto: ¡empate! |
| Piedra, papel o tijera | 20 | 11 s | Un desempate a piedra, papel o tijera con suspenso de final de mundial. |
| ¡Estatua! | 20 | 12 s | Bailan con música y cuando para… ¡estatua! Poses imposibles hasta que uno no aguanta la risa. |
| Telenovela | 35 | 14 s | Drama de telenovela: «¡Me traicionaste… con el Parchís!». Lágrimas, desmayo y reconciliación de capítulo final. |
| Superhéroe | 35 | 13 s | Con capa improvisada, uno vuela al rescate del otro, atrapado por un dado gigante malvado. |
| Abrazo de oso | 25 | 10 s | Uno corre desde lejos y le da al otro un abrazo de oso que lo levanta del piso y lo hace girar. |
| La selfie perfecta | 25 | 12 s | Intentan la selfie perfecta: ojos cerrados, caras raras, un pájaro imaginario… y a la cuarta, ¡la perfecta! |
| Ovación del público | 30 | 11 s | Terminan la partida y un público invisible los ovaciona: reverencias, flores volando y lluvia de confeti. |
| Maratón de besos | 40 | 11 s | Un besito… otro… y otro, cada vez más rápido, hasta batir el récord mundial. |
| Hacer las paces | 25 | 12 s | Enojados de espaldas… se miran de reojo, se les escapa la risa y sellan las paces con el meñique. |

En total son 50 escenas; todas juntas cuestan 1555 monedas.
