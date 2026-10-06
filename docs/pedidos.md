# Pedidos de Javier en cola

Lo que Javier pidió y todavía falta, en el orden en que se va a hacer. Se tacha (se borra) cuando queda hecho,
probado y subido.

## Sangre y Ceniza: correcciones y mejoras (pedido de Javier tras probarlo)

Textual: «Mejorar calidad de mapa; mejorar movilidad, se siente tosca, los ojos se cansan o se abruman por la
velocidad, se siente raro…»
- **Calidad**: mapas, enemigos, personajes «y todo lo demás»; «los sprites están muy básicos, falta mucho trabajo de
  texturas».

## Ronda 2 de arreglos

**Retrete espacial**
- Consumibles como la patineta de Subway Surfers: se activan cada cierto tiempo y protegen de 1 choque.
- Los cascos, retretes y estelas se consiguen **cumpliendo misiones** según su calidad (rareza).
- Estelas de mejor calidad, más nítidas; las premium mucho más fluidas.

**Cocina**
- Ver el pedido en todo momento después de tomarlo (hoy toca ir hasta la última estación para recordarlo).
- Chantilly y demás con textura y grosor: que se puedan hacer montañas.
- La mantequilla con número (1, 2) en vez de puntitos.
- Lo que se acumula (chantilly, miel…) con una ruedita pequeña de cantidad que avise cuándo cumple el pedido
  (sencillo, doble).
- Tomar el pedido más lento, con velocidad según el cliente, y sin poder cambiar de estación mientras se toma.

**Nombres**: Javier y Laura en vez de «Él» y «Ella» en todas las pantallas (`NOMBRE_ROL`).

**Tutoriales** para Lavarse la cara (Vampire Survivors), Súper Manía, Cien Puertas y los juegos más complejos.

**Súper Manía**
- La mitad de estantes de cada tipo por tienda (hay demasiados).
- La lista de mejoras solo muestra las que están desbloqueadas (aunque no alcance la plata).

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

- La app «Sala de Juegos» (NuestroHogar-Amigos) hoy trae Sangre y Ceniza y Lavarse la cara. Súper Manía, los juegos
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

- **Cien Puertas: arreglos y modo pareja** (rama `trabajo/puertas`, sin juntar). Hecho: papelitos legibles, zonas
  protegidas (nada tapa la puerta), revisión con rayos (`scripts/revisar-puertas.mjs`), modo pareja completo con
  `scripts/probar-puertas-linea.mjs`. Falta: juntar la rama principal en ella, correr
  `revisar-puertas.mjs 1 100 --semillas=0,1,2 --revolver` y `probar-puertas-linea.mjs`, mirar fotos de varias puertas,
  juntar y subir. Detalles en `docs/en-obra/cien-puertas.md`.
- **El Show de Nosotros** (rama `trabajo/show`, sin juntar; `mesa.html?juego=show`): concurso de preguntas de pareja
  con estudio 3D, presentador perrito, seis tipos de preguntas, pregunta del día en la nevera, el libro de nosotros y en
  línea. El último commit (`ab7d01a`, «avance en obra») quedó sin revisar. Falta: revisarlo, correr `probar-show.mjs` y
  `probar-show-linea.mjs`, mirar capturas del estudio (Javier y Laura en la tarima, el texto de las pantallas al
  derecho), juntar y subir. Diseño en `docs/show.md` de esa rama.
- Tele compartida, tocador de Laura, escenas premium (en pausa) y diseños premium.
- Voces con IA: esperan la clave de ElevenLabs (`docs/en-obra/voces-ia.md`).
