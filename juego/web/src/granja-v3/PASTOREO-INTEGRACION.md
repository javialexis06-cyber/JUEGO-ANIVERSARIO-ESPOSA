# Pastoreo libre y regreso del ganado

Bloque del 13 de octubre de 2026. Continúa el plan de ganadería sobre el mismo motor y guardado V5.
El modo anterior de corral permanece por defecto. No añade modelos, voces, música ni otro reloj de cuidado.

## Uso desde el mundo

Entra por la puerta del refugio y toca su comedero. **Pastorear por el terreno** activa la salida;
**Volver al corral** solicita el regreso. La tarjeta distingue animales dentro, en el corral y en el terreno.
La operación exige estar cerca del comedero o de la puerta del mismo refugio, conserva recursos y se guarda
inmediatamente. Si falla el almacenamiento, restaura el modo anterior y sus animales.

Salen por los pasos laterales existentes del corral. Se mantienen a un máximo de 12 metros del centro del patio,
en terreno propio, evitando agua, huecos, árboles, piedras, frutales, cultivos de espaldera, construcciones,
máquinas y cercas. Los portones abiertos permiten pasar; los cerrados bloquean. Las cercas fijas del corral
conservan sus pasos laterales; activar el modo no permite atravesar sus paredes.

La manada sigue las reglas previas: tiempo seco de 06:00 a 17:00, regreso por lluvia, invierno templado,
enfermedad o anochecer. Desactivar el modo solicita un regreso con pasos hasta el corral. Luego utiliza el
pasillo y la puerta existentes para entrar al refugio cuando corresponde. Un camino bloqueado hace esperar;
abrir el portón permite recalcularlo. No se abre un portón automáticamente.

El ganado detiene su paso ante el jugador, otros animales y compañeros próximos. Usa un radio lógico de
0,21 metros; los caballos conservan su radio mayor. No es un sistema completo de formación de manadas:
los cuerpos móviles pueden hacer esperar y el jugador conserva su movimiento anterior.

Los nidos siguen dentro. La recogida, el ordeño, la esquila y los cuidados utilizan la posición actual del
animal. Un cerdo deja las trufas junto a su posición en el terreno; encontrarlas no entrega inventario o
experiencia hasta recogerlas. Sus genes, productos, edad, hambre y cariño no cambian por caminar.
El pastoreo animado sigue usando el pasto o heno finitos del refugio, cada ocho horas reales.

No se puede cerrar o colocar una cerca sobre el cuerpo del ganado libre, ni colocar una construcción sólida
encima. Para mover o girar el refugio hay que solicitar regreso y esperar a que su manada vuelva al corral;
también hay que recoger sus trufas pendientes del terreno. El traslado explícito a otro refugio y el reinicio
de rutinas al dormir conservan sus reglas anteriores.

## Datos y API

- `Edificio.pastoreoLibre?: boolean`: omitido equivale al corral anterior; solo se permite en refugios productivos.
- `Animal.rutina.lugar`: admite `campo` además de `corral` y `refugio`. Las coordenadas y el destino siguen
  siendo locales al refugio y se guardan; se valida su alcance y que la posición pertenezca al terreno propio.
- `TrufaGanado.campo?: true`: distingue hallazgos del terreno de las trufas locales del corral anterior.
- `{tipo:'pastoreo_ganado', edificioId, libre, xJugador, zJugador}`: cambio explícito, cercano y sin coste.
- `motor.pasoGanado(segundos, jugador?)`: recibe tiempo activo y la posición del jugador; pausa en menús,
  resumen, otros territorios y expediciones. El paseo por el terreno también pausa al visitar interiores.
- `motor.estadisticasPastoreo()`: contadores de búsquedas, nodos, consultas y cachés para verificación.

No hay nuevas claves de almacenamiento ni sustitución del estado económico. La ausencia real no adelanta
las posiciones, la incubación o la edad; dormir conserva el calendario anterior. Importaciones corruptas
se rechazan sin sustituir una partida válida. Recarga conserva posición y destino; la ruta se reconstruye.

## Coste y límites

`pastoreo-ganado.ts` reparte el cálculo entre cuadros: **dos inicios de búsqueda y 64 pasos de búsqueda por cuadro**,
con un máximo de 384 nodos por búsqueda, pasos de medio metro,
validación de segmentos y consulta de suelo compartida. La caché tiene un máximo de 8.192 celdas; hay como
máximo una ruta por animal. Los cuerpos próximos se agrupan por casilla. Sin el modo activo ni animales
en el terreno, las rutinas no construyen estas rutas o cachés. No se incrementa la revisión del mundo
por cada paso, y se reutilizan los modelos y animaciones existentes.

Los recorridos de navegador preparan terreno, hora, recinto y posiciones de aproximación en un contexto
aislado. El paso real de las rutinas se adelanta con intervalos de 0,25 segundos, sin escribir posiciones
de ganado. El dibujo continuo y las fotos se pausan solo en ese recorrido específico; sus capturas se
dibujan realmente y el recorrido general conserva WebGL y fotos. Esto no mide FPS de un computador físico.

Quedan pendientes beber en refugios productivos, gestación de mamíferos, reproducción y equipo de compañeros,
monturas fantásticas y formación avanzada de manadas. No se declara terminado todo el motor.

## Integración con los avances visuales

Se conservan los refugios, cercas, portones, comederos, animales y películas de Claude. La vista consume
`animalVisible`, `posicionAnimal` y `clipRutina` existentes; no hay una posición duplicada de presentación.

La integración detectó que la nueva presentación de biomas de Sangre y Ceniza importaba un archivo de la
granja excluido de amigos. Sus cinco postales públicas se separaron en `src/sangre/datos/postales.ts`,
con los mismos IDs, textos y dirección de voz. La granja las sigue incorporando y la pareja mantiene su
audio; amigos muestra esas postales sin solicitar medios de la granja ausentes de su paquete. El filtro
de archivos y el comprobador de contenido de amigos permanecen activos.

Las comprobaciones y su alcance se registran en `PASTOREO-VERIFICACION.json`. La versión 219 anterior
contiene puertas, mostradores, mapas y rendimiento; este bloque requiere una compilación posterior.


## Comprobaciones de coste

En Node y con escenarios válidos preparados (suelo despejado, 600 pasos de 0,05 segundos), el paso de
240 animales en veinte refugios registró mediana de 1,18 ms, percentil 95 de 3,75 ms y máximo de 14,42 ms.
Con dos animales, la mediana fue 0,012 ms; con doce, 0,045 ms. La primera versión, con búsquedas completas
en un cuadro, había registrado 0,89 ms de mediana y 9,45 ms de percentil 95 para 240 animales. Distribuir
el trabajo reduce su concentración a costa de pequeñas esperas de ruta y algo más de trabajo habitual;
no elimina todos los picos iniciales o de recolección de memoria. Los resultados incluyen máximos y límites,
y no certifican FPS o rendimiento del juego completo en un computador o teléfono físico.
