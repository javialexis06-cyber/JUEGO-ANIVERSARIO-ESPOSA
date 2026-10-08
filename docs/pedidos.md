# Pedidos de Javier en cola

Lo que Javier pidió y todavía falta, en el orden en que se va a hacer. Se tacha (se borra) cuando queda hecho,
probado y subido.

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
con minijuegos: [`docs/en-obra/sangre-propuesta.md`](en-obra/sangre-propuesta.md) (preguntas al final). Los íconos
más elaborados de las mejoras van con esto (llegan muchas cosas nuevas).

Textual: «Mejorar calidad de mapa; mejorar movilidad, se siente tosca, los ojos se cansan o se abruman por la
velocidad, se siente raro…»
- **Calidad**: mapas, enemigos, personajes «y todo lo demás»; «los sprites están muy básicos, falta mucho trabajo de
  texturas».
- **Dos niveles de calidad**: la de hoy como «baja» (celulares menos potentes) y una «alta» con mapas mucho más
  detallados para el S24 Ultra y el computador.

## Ronda 2 de arreglos

**Lavarse la cara (Vampire Survivors)**
- (En obra con las salas) El chorro de agua más translúcido; ataque manual o automático a escoger (los de área
  —perro lanudo, bombero, astronauta— siguen automáticos); tutorial.
- **Íconos de poderes, armas y mejoras**: en el celular salen vacíos; renderizarlos y revisar que carguen en la APK.
- Un **panel de combinaciones**: ver qué tengo y con qué se combina para evolucionar y hacer combos (como la guía
  de evoluciones del original), también a mitad de partida.
- **Logros y recompensas por avanzar con cada personaje/disfraz** (maestría de cada uno).
- Seguir mejorando el minijuego con lo mejor de otros juegos del género, **sin chocar con Sangre y Ceniza** (que se
  queda con lo oscuro, las cuevas excavables, las expediciones por etapas y las clases serias).

## Amigos: lo que sigue

- La app «Sala de Juegos» (NuestroHogar-Amigos) hoy trae Sangre y Ceniza, Lavarse la cara y Súper Manía. Los juegos
  de mesa, el retrete y la cocina con amigos ya funcionan desde «Soy un amigo» en la app de la pareja; falta llevarlos
  también a la app de amigos (agregar sus páginas a `PAGINAS_AMIGOS`, permitir su código en `vite.config.ts` y dejar
  `verificar-amigos.mjs` limpio: las frases de pareja de la mesa y las escenas premium no pueden ir adentro).
- **El repositorio es público**: los enlaces de «Invitar amigos» llevan el nombre del repositorio y cualquiera puede
  leer los documentos de la pareja. Opciones para Javier: volverlo privado y publicar las APK en otro repositorio
  público solo de descargas, o dejarlo así.

## Después
- Sótano tétrico con contraseña y juego de terror estilo *No, I'm Not a Human* (estudio del género, historia
  profunda).
- Juego de resolver crímenes: 10 casos revisando el celular de la víctima (apps parecidas a las reales, personas
  ficticias). Ojo: a Laura se le ocurrió que su boda tenga un juego así («un crimen por mesa que deban solucionar»).

## Lo acumulado (en orden)

- **El Show de Nosotros** (rama `trabajo/show`, sin juntar; `mesa.html?juego=show`): concurso de preguntas de pareja
  con estudio 3D, presentador perrito, seis tipos de preguntas, pregunta del día en la nevera, el libro de nosotros y en
  línea. El último commit (`ab7d01a`, «avance en obra») quedó sin revisar. Falta: revisarlo, correr `probar-show.mjs` y
  `probar-show-linea.mjs`, mirar capturas del estudio (Javier y Laura en la tarima, el texto de las pantallas al
  derecho), juntar y subir. Diseño en `docs/show.md` de esa rama.
- Tele compartida, tocador de Laura, escenas premium (en pausa) y diseños premium.
- Voces con IA: esperan la clave de ElevenLabs (`docs/en-obra/voces-ia.md`).
