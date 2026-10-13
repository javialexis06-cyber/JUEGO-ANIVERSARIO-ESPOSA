# Puertas, mostradores, mapas y rendimiento

Bloque del 12 de octubre de 2026, solicitado por Javier. Conserva V5, claves, IDs, huellas,
precios, genomas, calendarios al dormir, cuidados reales, películas y recursos visuales anteriores.
No produce modelos, voces ni música nuevos.

## Entrada y salida físicas

`accesos-fisicos.ts` reúne puertas de granja con sus cuatro giros, locales, viviendas independientes,
anexos, dormitorios, viviendas de Astra y módulos de colonias. El clic busca un camino hasta la
puerta. El umbral detecta un cruce dirigido, estrecho y continuo: aparecer sobre él, caminar junto
a una pared o saltar de posición no activa la transición. Un bloqueo breve impide dobles entradas.
Se mantienen horario de visita y dos corazones para dormitorios. La vivienda anexa se abre desde
la puerta posterior de su propio local y sale al barrio; las visitas anteriores siguen funcionando.

Al entrar no se abre una tarjeta de salida. Se sale por el marco de la puerta. Los cuidados se
consultan al tocar animales, comederos y muebles. El rincón derecho del invernadero conserva el
control de riego. La cabaña sigue llevando a la casa real; la puerta del cuarto visible devuelve a la granja
cuando el personaje llega a ella. El botón de recuperación queda disponible antes de iniciar sesión.

`AvatarGranja` conserva los caminos indicados con el mouse cuando no hay teclas presionadas.
El teclado los sustituye al moverse. Paneles, pesca, colocación, transporte y monturas enfermas
pausan el movimiento. La cámara acompaña al personaje con el seguimiento anterior.

## Mostradores

El personaje puede caminar dentro del negocio. Acercarse al frente del mostrador, o tocarlo,
abre su catálogo. La tienda de semillas muestra productos con los iconos existentes y sus precios;
cada clic compra una unidad mediante la acción del motor. Las compras y encargos de la interfaz
requieren estar frente al mostrador. La API anterior conserva sus contratos de compatibilidad.
Compras y ventas del local se guardan inmediatamente; si falla el almacenamiento, se restaura la
partida anterior. Las monedas, materiales y productos no se acreditan dos veces.

## Trabajo acotado y memoria

- Tres fondos recientes del valle, incluyendo el activo; dos capas recientes de Astra. Reutilizar
  un exterior evita reconstruirlo cada vez que se sale de una vivienda o local. Las claves incluyen
  partida, zona, interior, nivel de mina, nivel de refugio, festival y exposición del museo.
- El exterior guardado y el pueblo vecino se preparan en la pantalla de carga inicial; una
  vivienda guardada de Astra prepara también su exterior. Los escenarios ocultos dejan de
  animarse y se sacan de la escena activa sin destruir sus recursos.
- La puerta o salida cercana del valle se prepara durante un turno libre del navegador. No se
  precargan todos los mundos ni se concede acceso a zonas bloqueadas. La precarga no expulsa el
  escenario activo. Los recursos compartidos de Claude conservan su propietario.
- Utilería repetida se dibuja por instancias en sectores de 16 metros, usando geometría, material
  y transformaciones originales. El viento rígido continúa con sus clips. Esqueletos, animales,
  transparencias y espejos permanecen en el dibujo anterior. Los golpes recuperan el objeto original.
- Selección de casilla, fila, herramienta y personaje no copia los 1.206 obstáculos que estas
  acciones no pueden modificar. El resto del respaldo y las transacciones económicas se conserva.
  La vista actualiza esas selecciones sin reconstruir sus piezas.
- La vista recuerda hasta 512 consultas de colisión por estado y revisión. Canvas de letreros
  propios y búferes de instancias se liberan al retirar sus escenarios.
- Perfil ligero por defecto: muchos núcleos de CPU no acreditan una GPU potente. Se respeta
  la calidad elegida y guardada en Ajustes.

## Mapas

Solo se rotulan ubicaciones. Los NPC usan sus retratos existentes, o una silueta, en la posición
visible del personaje; no se pintan sus nombres. Hay hasta 64 retratos en memoria. El minimapa
sigue las posiciones decimales por cuadro mientras se camina; las bases y el reloj se actualizan
por separado. El mapa grande conserva zoom, arrastre y marcas.
Las fotos se toman en reposo, con una sola lectura asíncrona de GPU pendiente y un intervalo
mínimo de 1,2 segundos. Una foto tardía de otra partida o una hoja expulsada se descarta.

## Alcance de la medición

La comparación utiliza la misma partida y perfil ligero, Chromium y un contenedor con SwiftShader.
Mide costes de JavaScript y conteos de dibujo, con dibujo continuo y fotos pausados durante el
benchmark. No acredita FPS, consumo, batería ni ausencia de tirones en un PC o teléfono físico.
La primera visita todavía carga recursos y puede compilar shaders; la caché tiene límites deliberados.
El recorrido general aparte conserva WebGL y fotos activos. La evidencia final se añade tras las pruebas.

## Verificación de entrega

47 suites sin fallos; 14 casos nuevos de puertas, permisos, anexo, cachés e instancias.
Ambos builds pasan, incluida la exclusión del contenido privado en la edición de amigos.
Navegador: diez comprobaciones de puertas, mostradores y mapas; seis del recorrido con WebGL
y fotos; once de cercos y once de pesca, 42 en total, incluidas cuatro comprobaciones de acceso, aviso y regreso de aventuras. Se inspeccionaron las capturas.

En la misma partida y perfil ligero, los retornos al pueblo bajan de 2.431–2.847 ms a
9,1–11,1 ms. La selección en el motor baja de 1,624 a 0,149 ms de mediana; el flujo de selección
completo, de 8,5 a 3,5 ms. El dibujo pasa de 408 a 351 llamadas, con aproximadamente un 7 %
más de triángulos por agrupación. La sincronización forzada mide 3,1 ms frente a 1,8 ms;
la selección evita ese trabajo. Son mediciones del contenedor, no FPS físicos.

Evidencia y límites: [FLUIDEZ-VERIFICACION.json](FLUIDEZ-VERIFICACION.json).

Los nuevos modelos de Claude de `dce94b06` (herramientas, monstruos, vetas, invernadero y envíos)
se incorporaron antes de repetir regresión, ambos builds y los recorridos de navegador.
La comparación de dibujo incluye también esos modelos nuevos; no los revierte para reducir el conteo.
