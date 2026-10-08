# Pedidos de Javier en cola

Lo que Javier pidió y todavía falta, en el orden en que se va a hacer. Se tacha (se borra) cuando queda hecho,
probado y subido.

## Por dónde seguir (nota para el próximo Claude)

Último trabajo subido: el estudio de las dos wikis (lo que les falta a Lavarse la cara y a Sangre y Ceniza) y la
**mitología de Astra** que Javier trajo de la granja ([`docs/mitologia.md`](mitologia.md)). Javier respondió lo de
Sangre y Ceniza 2 (8 de octubre): **se hace primero**, con 5 etapas, escenas cortas con la mitología (Él y Ella de
protagonistas) y todo lo de armas. Orden:

1. **Sangre y Ceniza 2**, por fases (sección 4 de `docs/en-obra/sangre-propuesta.md`): fase 1 = etapas que se ganan
   peleando, el Guardián, la Noche se impacienta, 5 etapas, precios que suben, ratas del tesoro y mini-élites.
2. **Lavarse la cara 2** (`docs/en-obra/lavado-propuesta.md`): antes de empezar, hacerle a Javier las 5 preguntas del
   final (armas, escenarios, modos y tesoros, disfraces, aventuras).
3. **Amigos: mesa, retrete y cocina en la app de amigos** (abajo, en «Amigos: lo que sigue»).
4. **El Show de Nosotros** (rama `trabajo/show`, en «Lo acumulado»).
5. **Cien Puertas con mucho más diseño** (punto 4 de «Ahora»): es para lo último.

Esperan a Javier (no se empiezan solos): lo que sigue abierto de la mitología (sección 2 de `docs/mitologia.md`), las
respuestas de Lavarse la cara 2, las ideas del sótano, la
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

**Versión 2 (propuesta entregada, falta pulirla con Javier)**: misiones que llenen la etapa (se ganan matando al
Guardián, la Noche se impacienta), más tipos de misión, dificultad y precios que suben, seis minerales para el Pozo,
mapa de la Noche con historia y retos por bioma y clase, maestrías, contratos, infinito con mapa que crece y refugio
con minijuegos, y (sección L) seis sobrecargas por arma con etiquetas especiales, evolución para todas las armas y
uniones, 13 armas comunes nuevas, reliquias por hitos y el familiar que acompaña:
[`docs/en-obra/sangre-propuesta.md`](en-obra/sangre-propuesta.md) (preguntas al final). Los íconos más elaborados de
las mejoras van con esto (llegan muchas cosas nuevas).

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

- La app «Sala de Juegos» (NuestroHogar-Amigos) hoy trae Sangre y Ceniza, Lavarse la cara y Súper Manía. Los juegos
  de mesa, el retrete y la cocina con amigos ya funcionan desde «Soy un amigo» en la app de la pareja; falta llevarlos
  también a la app de amigos (agregar sus páginas a `PAGINAS_AMIGOS`, permitir su código en `vite.config.ts` y dejar
  `verificar-amigos.mjs` limpio: las frases de pareja de la mesa y las escenas premium no pueden ir adentro).
  Lo que ya se revisó para hacerlo:
  - Las páginas ya existen y dejan entrar a un amigo: `retrete.html` y `cocina.html` (código en `src/sueltos/`, con
    guardia en el `<head>`) y `mesa.html?amigo`; en `src/amigos/juegos.ts` ya están las tarjetas (salen «Muy pronto»
    hasta que la página tenga `<meta name="apto-amigos" content="si">`).
  - El retrete (`src/casa/cohete.ts` y `src/casa/cohete/`) esconde lo de la pareja en modo neutro, pero los textos
    están compilados adentro (frases, banderitas, récord de la pareja, «galaxia del amor»): hay que sacarlos a un
    archivo de pareja con su sustituto vacío, como `lavado/pareja.ts`. Usa `casa/modelo`, `casa/ropa`,
    `reacciones/muneco`, `salas/*`, `recursos` y `sonido`.
  - La cocina (`src/casa/cocina/`) usa `casa/modelo`, `casa/ropa`, `salas/*`, `personaje`, `recursos` y `sonido`;
    revisar sus textos (invitados, pantallas) con `verificar-amigos`.
  - La mesa (`src/mesa/`) usa `casa/modelo`, `casa/sincro` (ya tienen sustituto), `escenas/catalogo` y
    `escenas/cine` (las escenas premium son de la pareja: sustituto vacío) y `reacciones/frases.ts` (tiene frases de
    la pareja: sacarlas a un archivo aparte con sustituto neutro); el Clue y el Show (si ya se juntó) también se
    revisan.
  - Copiar a `dist-amigos` solo los modelos que usan (agregar a `PUBLICOS_AMIGOS` o un filtro como `MODELOS_SUPER`).
  - Probar: `npm run build:amigos` (que `verificar-amigos` diga «Limpia»), `vite preview --mode amigos` y adaptar
    `scripts/probar-amigos-juegos.mjs` para que entre desde `amigos.html` de dist-amigos a los tres juegos.
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
