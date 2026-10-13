# El cine de la granja

Pequeñas películas de la historia principal de la granja, hechas dentro del juego (three.js) con los peluches y los
modelos de Blender: el prólogo es la primera. Javier pidió (12 de octubre de 2026) que fueran «tipo película, con
animación fluida» y que todo lo de las diosas sonara «armonioso y celestial»; si le gusta el prólogo, se hacen las demás
escenas grandes con el mismo estilo.

## El prólogo (`src/granja-v3/cine-prologo.ts`, ~125 s)

1. **Cosmos**: estrellas y nebulosa; una chispa crece, estalla y nace el planeta de Celia (mares, tierra, nubes y
   atmósfera aparecen desde un corazón de luz). Narrador.
2. **Aura** llega con su estela dorada y **Lara** con su estela violeta; cada una dice su línea en primer plano.
3. Las dos levantan los brazos y tejen el **Santuario**: un escudo de hexágonos que cierra desde Aura (oro) y desde Lara
   (violeta) hasta encontrarse en un destello. Narrador.
4. La cámara cae al planeta (fundido blanco) y amanece en el **valle**: la granja dormida entre la maleza. Narrador.
5. **Él y Ella** llegan por el sendero; cae una columna de luz, brotan flores y aparece **Celia** flotando entre
   pétalos. Sus cinco líneas en planos distintos (primer plano, contraplano sobre su hombro, plano general con las flores
   creciendo, plano medio con los brazos en alto).
6. Celia se despide subiendo en destellos y aparece el título «Nuestra granjita · El Vientre de Celia».

Mitología: `docs/mitologia.md` (Celia, las Diosas Hermanas y el Santuario Protegido). Las líneas están en
`src/granja-v3/cine-lineas.ts` (texto del subtítulo y cómo se dice para ElevenLabs).

## Cómo funciona

- **Motor** (`cine-granja.ts`): capa a pantalla completa con franjas de cine, viñeta, subtítulos con quien habla,
  títulos y fundidos; renderizador propio con bloom (UnrealBloom), sombras suaves y tono ACES. Cada toma tiene su
  escenario, su plano de cámara (de → a, con curva suave), su línea y su música. Si la voz de una línea ya existe, la
  toma dura lo que dure la voz. `simular(seg)` avanza cuadro a cuadro (grabar video y pruebas); `ContextoToma.desde(id)`
  da el tiempo desde cualquier toma, así lo que dura varias tomas es exacto en cada cuadro.
- **Actores** (`cine-actores.ts`): Él y Ella son sus peluches; las diosas son el muñeco de Ella vestido con la ropa
  exclusiva de `personajes/blender/ropa_diosas.py` (`vestido_diosa` en tres colores, `corona_hojas`, `corona_llamas`,
  `velo_lara`) y el clóset de siempre (peinado, alas, capa), con un halo y una luz propia por fuera (los materiales del
  muñeco se comparten con la Laura del juego y no se tocan).
- **Escenarios** (`cine-prologo.ts`): el cosmos con sombreadores propios (estrellas, nebulosa, planeta, nubes,
  atmósfera, escudo, estelas y flujos de energía) y el valle con los kits de Blender (`granja_monte.glb`, la cabaña, la
  cerca y la maleza de `granja-v2/`) instanciados, cielo de amanecer, polen, columna de luz, pétalos y flores que brotan.
- **En el juego** (`main.ts`, `verPrologo`): sale sola al empezar una partida nueva (paso «Llega Celia» de la guía) y
  se puede volver a ver en Ajustes («Ver el prólogo»). Mientras corre, la granja no se dibuja ni suena. Si falla (un
  teléfono sin WebGL suficiente), queda el prólogo escrito. Gancho de prueba: `__granjaV3.prologo()`.
- **Pruebas y video**: `node scripts/_cine.mjs cuadros <carpeta> t1,t2…` (fotos sueltas) y
  `node scripts/_cine.mjs video <carpeta> 24 [desde] [hasta]` (todos los cuadros; luego ffmpeg los junta con la
  música). Scripts temporales (`_*.mjs`).

## Voces y música (ElevenLabs)

- `node scripts/granja-v3/voces-cine.mjs reparto` busca voces etéreas en español para Celia, Aura y Lara (el narrador es
  el de la granja) y las deja en `voces-guion/cine-reparto.json`; `node scripts/granja-v3/voces-cine.mjs` genera las
  líneas. Las diosas pasan por un procesado celestial «suave» con ffmpeg (eco corto y discreto, un coro que casi no se
  nota y un poquito de brillo arriba; Javier descartó la catedral por exagerada); el narrador, por una sala cálida. Salen a `public/audio/cine/` y se declaran con su duración en
  `public/granja/cine/medios.json` (aparte de `granja/astra/medios.json`, que su script reescribe entero).
- Música: el prólogo usa M12 («Heaven Theme Loop») en el cosmos y M13 («First Light Particles») en el valle, CC0, de
  la granja; a Javier le gustaron y se quedan. Debajo de una voz la música baja a 0,3 (no a 0,18) para seguir
  oyéndola.
- **Hecho (12 de octubre de 2026)**: las 10 voces del prólogo. Reparto: narrador Josué Maya (el de la granja), Celia
  «Alejandra» (joven y dulce), Aura «Valentina» (cálida y luminosa), Lara «Esperanza» (colombiana, serena).

## Las películas que faltan (las 14 cinemáticas de la campaña)

Cada una sale al cerrar su contrato (`CINEMATICAS_ASTRA` en `astra.ts`). Hoy se juegan como escena de subtítulos con
voz; falta hacerlas película con este motor, como el prólogo. Los guiones (planos, duración, sonido y líneas) están en
`docs/narrativa/02-campana.md` (C01–C10) y `docs/narrativa/10-figuras-y-escenas.md` (C11–C14); las voces ya están
generadas (`public/granja/astra/medios.json`) y la música, asignada (`MUSICA_ESCENAS_ASTRA`).

| | Escena | Sale en | Duración | Voces | Música | Película |
|---|---|---|---|---|---|---|
| C01 | Dos surcos | P01 | 70–90 s | 12 | M01 (CC0) | falta |
| C02 | La campana y la mesa | P03 | 100–120 s | 13 | M10 (compuesta) | falta |
| C03 | La firma | P05 | 120–150 s | 13 | M09 (CC0) | falta |
| C04 | La copa | P09 | 150–180 s | 16 | M11 (compuesta) | falta |
| C05 | Una mañana que no basta | P10 | 90–110 s | 10 | M08 (CC0) | falta |
| C06 | La casa de Elián | P15 | 150–180 s | 16 | M14 (compuesta) | falta |
| C07 | El tratado | P21 | 120–150 s | 12 | M21 (compuesta) | falta |
| C08 | El ceramista | P22 | 110–140 s | 13 | M22 (compuesta) | falta |
| C09 | Una estrella sin dueño | P23 | 150–180 s | 14 | M19 (compuesta) | falta |
| C10 | La parcela de mañana | P24 | 80–100 s | 11 | M20 (compuesta) | falta |
| C11 | El agua que escucha | F01 | 2–3 min | 20 | M23 (CC0) | falta |
| C12 | El día posterior al nacimiento | F04 | 3 min | 21 | M23 (CC0) | falta |
| C13 | El precio de una alianza | F06 | 3 min | 20 | M23 (CC0) | falta |
| C14 | La cuenta que ya no se cierra sola | F12 | 3–4 min | 20 | M23 (CC0) | falta |

## Las películas del Acto I (12-13 de octubre de 2026)

`src/granja-v3/cine-acto1.ts`, con su catálogo en `cine-catalogo.ts` (`PELICULAS[id]`, se cargan solo al verlas):

| Id | Película | Escenario | Cómo se ve en el juego |
|---|---|---|---|
| C01 | Dos surcos | la granja de la tarde (dos surcos, cabaña, pozo, cerca) | botón «Ver C01» de la campaña (`accionAstra` → `verPelicula`) |
| C11 | El agua que escucha (con la entrada de Fuatia) | la granja con el canal | «Ver C11» |
| C02 | La campana y la mesa | la plaza del Pueblo del Sol, de tarde | «Ver C02» |
| C03 | La firma | el archivo (cuarto con bibliotecas) | «Ver C03» |
| SC0 | La Noche Eterna | terraza del castillo, la casa de noche y el altar de Lara | `__granjaV3.pelicula('SC0')` (falta llevarla al mapa de la Noche de Sangre y Ceniza) |
| SC1 | Las Afueras | el cementerio hundido, la grieta y el grifo | `__granjaV3.pelicula('SC1')` (ídem) |
| ELI | El brote que puede esperar | la plaza en la Fiesta del Despertar Dorado | `__granjaV3.pelicula('ELI')` (falta dispararla al cerrar la misión de Eliana) |

Al terminar una película de la campaña, su escena queda leída (no se repiten los subtítulos). Las líneas de las 14
cinemáticas salen de `granja/astra/produccion.json` con `node scripts/granja-v3/lineas-cinematicas.mjs`
(`cine-lineas-campana.ts`); sus voces ya existían y `voces-cine.mjs` las declara en `granja/cine/medios.json` con su
duración. Las líneas nuevas (Sangre y Ceniza, secundarias, el Altar, la boda, los lugares) están en
`cine-lineas-historia.ts` y `cine-lineas-lugares.ts`, todas con voz.

**La caja de herramientas** (`cine-kit.ts`): cielos por hora (día, tarde, atardecer, noche, noche roja) con estrellas,
suelo con lomas, luces con sombras, luz que titila, fogata, motas (ceniza, polen, escarcha), la Constelación de los
Amantes, `poner` (una pieza de un kit de Blender parada en el piso) y **la dirección automática de diálogos**
(`tomasDialogo`): para cada línea escoge plano medio, sobre el hombro, de dos o general, sin meter la cámara en un
obstáculo ni detrás de alguien, del lado del público (`audiencia`), dentro del cuarto en interiores (`dentro`), y con
los muebles bajos (`bajos`) que se pueden mirar por encima. `actuarDialogo` mueve boca y manos del que habla y hace que
los demás lo miren.

**Actores** (`cine-actores.ts`): además de Javier, Laura y las diosas, `actorDiosa('fuatia')` (vestido de los cuatro
elementos), `actorVecino(id)` (cualquier habitante con su ropa; `sin` quita el sombrero o lo de la cara) y
`actorVestido` (el Conde antes del pacto, la ropa de boda…).

**Pruebas**: `node scripts/_cine.mjs <id> <carpeta> tomas` (con el servidor de pruebas en 5176) saca una foto por toma;
`scripts/_peli_juego.mjs` la reproduce dentro de la granja.

## Las películas del Acto II (13 de octubre de 2026)

`src/granja-v3/cine-acto2.ts`:

| Id | Película | Escenario | Cómo se ve |
|---|---|---|---|
| SC2 | El fuego bajo la piedra (Misterio 1: el mural, Aura y Lara ven apagarse un mundo, Vael'Thor) | la mina de los dragones (bioma de minas, La Cría, dragones) | Sangre: puerta del Subsuelo |
| T03 | La cría que no quiere hablar | el corral al atardecer (granero, cría de unicornio, Fuatia) | al cerrar la historia T03 |
| SC3 | El Santuario roto (Misterio 2: las prisiones de Vael'Thor) | la abadía en llamas, monjes rezándole a otro | Sangre: puerta del Santuario |
| C04 | La copa (con el Misterio 3, el Lazo Primordial) | la terraza del trono, la grieta, Nath'Gora detrás, Lara se lleva al Conde | «Ver C04» en la granja y la puerta de la Corte en Sangre (es la misma película) |
| C05 | Una mañana que no basta | el patio de Vigilia (camillas, la sopa) | «Ver C05» |
| SC4 | El descenso («Todavía no») | el abismo de Astra, una estrella muerta | Sangre: justo después de La copa |

Actores nuevos: `actorNathGora()` y `actorVaelThor()` (armados con el clóset; los modelos propios siguen pendientes).
Las presentaciones de lugares viven en `postal.ts` (cámara del juego, franjas, nombre y narrador), se disparan al
llegar a un lugar nuevo (`vigilarLugar` en `main.ts`) y se recuerdan en el teléfono (`granja-postales-vistas`).

## Las películas del Acto III (13 de octubre de 2026)

`src/granja-v3/cine-acto3.ts`:

| Id | Película | Escenario | Cómo se ve |
|---|---|---|---|
| S08 | La ayuda que no llegó (cómo nació Nath'Gora) | papel animado: láminas pintadas en lienzo (guardián, estrella, templo, coronas que caen) | al cerrar el secreto S08 |
| C12 | El día posterior al nacimiento | el archivo (más grande) con las cuatro marcas de los elementos | «Ver C12» |
| ENE | Lo que no vuelve idéntico (Eneas, los ciclos) | el Rosal Eterno de Verdia (casa de Verdia, rosales, cerezos, arco de rosas) | al cerrar la historia de Eneas |
| OFE | La casa que dejé esperando (Ofelia) | Senda al atardecer (casa de Senda con andamio que se va, escalones de luz) | al cerrar la historia de Ofelia |
| C06 | La casa de Elián | el refugio de la Forma Fija: el vaso, la ventana y la marca de humo cambian | «Ver C06» |
| SER | El nombre que no se pronuncia por otro (Serena) | un cuarto de noche con una vela | al cerrar la historia de Serena |

`archivo(cast)` y `cuarto(m, ancho, fondo)` (en `cine-acto1.ts`) arman cuartos de cualquier tamaño con cualquier reparto.
En interiores la cámara de los diálogos va más alta (mira por encima de las cabezas) y el narrador habla desde una esquina.

## Las películas de los Actos IV y V (13 de octubre de 2026)

`src/granja-v3/cine-acto4.ts`: C13 (la estación sobre Celia, con el planeta en el cielo y las cuatro lecturas), C14
(Confluencia: cuatro pilares de los elementos que se cierran uno a uno y Vael'Thor en proyección), C07 (el tratado
en la plaza del Pueblo del Sol; los representantes de los otros mundos con un halo de comunicación; Celia aparece en
la mesa), C08 (el ceramista: la vasija abierta y dos recuerdos en papel), C09 (el Borde de Astra: el escudo, la
constelación y Nath'Gora como una sombra enorme que se aleja) y C10 (los dos surcos de C01, ya sanos, con
`granja(false, { reparto })`). Las 14 cinemáticas de la campaña ya son película y se ven al tocar «Ver».

## El epílogo: el Altar del Lazo y la boda (13 de octubre de 2026)

`src/granja-v3/cine-epilogo.ts`:
- **ALT «El Altar del Lazo»** (~67 s, de noche en el patio de la cabaña). Las reliquias llegan volando al altar y lo
  encienden. La constelación se dibuja sobre el techo. Las cuatro diosas aparecen con un destello e invitan a Eterna.
  Todos están en medio círculo abierto hacia la cámara, que es como mejor dirige `tomasDialogo`. A Lara y a Fuatia se
  les dan planos propios porque quedaban tapadas.
- **BOD «Siempre te elegiré»** (~4,5 min con créditos), en Eterna (`personajes/blender/granja_eterna.py` →
  `granja_eterna.glb`). Por planos:
  - La llegada, con el grifo que trae el velo.
  - Celia hace florecer el arco rosa por rosa, Aura enciende las velas del camino con una chispa y Fuatia teje el lazo
    de cuatro hilos.
  - Laura entra mientras Javier se frota las manos.
  - Lara oficia sin velo. Laura no habla: sin votos.
  - La constelación entera y el pulso del escudo.
  - La fiesta: baile lento, el unicornio de la mesa y el dragón en la fogata.
  - El muelle del río con la frase de Javier en off y fundido a blanco.
  - La mañana siguiente en la parcela («¿Y mañana?» «Miramos si brotó»).
  - Los créditos con los 27 capítulos y «Feliz aniversario».
- **Escala**: los muñecos de peluche tienen cabezas de casi un metro, así que las piezas de Eterna van al doble (el arco a
  ×2,2, el pabellón a ×2,3) y los invitados quedan de pie (sentados no caben). Las sillas vacías van detrás.
- **Ropa de boda**: `actorNovio('el' | 'ella')` en `cine-actores.ts` (saco azul noche con corbatín; vestido, velo y
  tacones). `actorDiosa('lara', true)` es Lara sin velo, con una diadema clara.
- **Cuándo sale**: `vigilarBoda()` en `granja-v3/main.ts`. Se dispara con P24 y F12 cerradas (`astra.expedientes`) y
  el final de Sangre y Ceniza visto (`localStorage['astra-sangre-final']`, que marca `sangre/historia_pareja.ts` al ver
  «corte»). Sale una sola vez (`astra-boda-vista`); se puede repetir con `__granjaV3.pelicula('ALT' | 'BOD')`.
- **Créditos con fotos**: cada capítulo lleva su foto a un lado (`public/granja/cine/fotos/<id>.jpg`, 480×216). Se
  vuelven a sacar con `node scripts/_fotos_creditos.mjs <carpeta> [id:fracción,…]` (servidor en 5176), recortando las
  franjas. Si una película cambia mucho, repetir su foto.

## Sangre y Ceniza: presentaciones de lugar y la voz del Conde

- `sangre/ui/postal.ts`: la primera vez que se juega solo en un bioma, el mundo se detiene en pausa de cine
  (`Partida.pausar(true, true)`, a 30 cuadros), la cámara se aleja girando (`Escena3D.postal`) y sale el nombre del lugar
  con la voz del narrador (`LUG.<bioma>`). En grupo no sale. En pruebas, `sangre.html?prueba=1&postal=1`.
- `vozConde()` en `historia_pareja.ts` (la de amigos no hace nada): el HUD la llama al aparecer el Conde y cuando pasa a
  la fase 2.
