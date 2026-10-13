# Cercos, portones y llamada de compañeros

Las tres vallas anteriores bloquean su casilla. El portón conserva su huella de dos casillas,
incluidos los cuatro giros, y solo permite cruzar mientras está abierto. Personaje, mascotas,
caballos, búsqueda de rutas y desembarco comparten la colisión de `transito.ts`.
Los corrales del ganado conservan su recinto y puerta anteriores; este bloque no amplía su
navegación libre fuera del corral.

## Construcción, paso y recuperación

Se mantienen IDs, recetas, precios, sectores, colisiones de edificios y V5. Los portones nuevos
y los anteriores sin `portonAbierto` empiezan abiertos: cerrar es una decisión explícita.
Las vallas anteriores adquieren colisión; si hace falta liberar el paso, toca una valla cercana,
selecciona **Editar en modo diseño** y usa los controles anteriores para moverla o guardarla.
Guardar devuelve una pieza del mismo tipo; la mochila llena conserva la construcción.

Toca el portón desde cualquiera de sus lados para **Abrir portón** o **Cerrar portón**. Es necesario
estar en el exterior de la granja, a un máximo de 2,8 m de su huella. Se puede operar montado.
Cerrar sobre el personaje, mascota, caballo o ganado visible se rechaza. Colocar o mover un cerco
sólido sobre un ocupante también se rechaza antes de consumir una pieza. Mover o girar el portón
conserva su apertura. Abrir libera sus casillas y renueva las rutas de compañeros.

La apertura es un booleano opcional exclusivo del artículo `porton`; valores corruptos o una
apertura atribuida a otra pieza se rechazan al importar. Las acciones de cercos guardan de inmediato.
Si el almacenamiento falla, se restauran la barrera, inventario, revisión y estado anterior.
Abrir, cerrar o repetir una petición no concede monedas, energía, experiencia, amistad o materiales.

## Llamar por el camino

En la ficha de mascotas/caballos, **Llamar por el camino** pide acercarse mientras ambos están en
el exterior de la granja, entre 06:00 y 19:00. La ficha se cierra para permitir la marcha.
No transporta al animal desde otro mundo ni elimina vallas. La búsqueda visita hasta 512 celdas;
un cerco cerrado hace que busque otro paso o espere. Abrir el portón renueva la ruta.

El caballo camina hasta quedar cerca y deja de seguir; montar también cancela la llamada.
La noche y dormir cancelan la llamada del caballo. Las mascotas conservan su seguimiento elegido
y el retorno nocturno anterior. Enfermedad/depresión detienen la marcha; el caballo también necesita
estar alimentado. La llamada no alimenta, cura, consume objetos ni concede vínculo.
La posición y el indicador anterior `seguir` se guardan; no hay un botón pulsado persistente.
Recarga conserva el último paso guardado. Ausencia, cuidados reales y dormir no simulan el recorrido.

## API y presentación

- `actuar({tipo:'porton',edificioId,abierto,xJugador,zJugador})`: intención explícita, sin alternar
  otra vez por un doble toque. Repetir el estado vigente no cambia la partida.
- `actuar({tipo:'compania',accion:{tipo:'llamar',id},xJugador,zJugador})` y el paso visible
  anterior `pasoCompania`: rutas y colisiones reales, sin teletransporte ni una economía aparte.
- `portonAbierto`, `huellaCerco`, `cercoBloquea`, `cercoOcupado`: contrato compartido de apertura,
  ocupación y paso. Conservarlo al integrar un modelo o una animación final del portón.

Se reutiliza la presentación sencilla del cerco: al abrir quedan retirados los travesaños y se
conserva el poste. No se producen modelos, imágenes, voces o música. Los actores, películas, cartas,
materiales y avances del lavado del frente visual se conservan.

## Comprobaciones y pendientes

`probar-cercos.mjs` comprueba migración, tres vallas/cuatro giros, huellas, apertura, cuerpos en el
paso, construcción, montaje, devolución, mochila llena, importación y rutas de las cuatro familias.
Usa terreno, recursos y posiciones preparados; no representa una campaña completa.
`verificar-cercos.mjs` comprueba controles, tránsito, recarga, diseño, llamadas y almacenamiento
fallido. El escenario específico pausa dibujo; el recorrido general mantiene WebGL y fotos del mapa.

Siguen pendientes navegación libre del ganado, colisiones avanzadas entre animales, reproducción
y equipamiento de compañeros, interiores de descanso y monturas fantásticas. La llamada actual
solo funciona en la granja. Rendimiento y destreza en teléfonos físicos requieren su propia prueba.

## Verificación de entrega

46 suites sin fallos, 19 casos de cercos y 46 de compañía anterior; builds de pareja y amigos
correctos. Navegador: 11 comprobaciones de cercos, 11 de pesca compatible y seis del recorrido
con WebGL y fotos activos. Escenarios preparados, sin certificar teléfonos físicos.
Evidencia: [CERCOS-VERIFICACION.json](CERCOS-VERIFICACION.json). Actos I/II, postales y
Sangre y Ceniza de Claude integrados hasta `d783b728`; películas y lavado conservados.
