# PvZ 1 y PvZ 2 · motores originales como minijuegos

23 de octubre de 2026. Javier pidió usar PvZ-Portable y Gardendless con sus propios combates, animaciones,
oleadas, habilidades y modos; cada uno debe ser un minijuego independiente. La historia territorial debe
adaptar el motor que mejor permita frentes simultáneos, reservas exclusivas y carriles por escenario.
Este pedido sustituye el uso de esos proyectos únicamente como referencia. Los mundos nuevos siguen pausados.

**Aclaración posterior del usuario:** Javier no tiene `main.pak` ni `properties/`. No esperar esos archivos
ni volver a pedírselos para avanzar la historia. Gardendless pasa a candidato principal por disponer de sus
recursos; la adaptación territorial sigue pendiente. Portable conserva su entrada opcional e importador.

## Integración realizada

- `jardin.html?modo=pvz1`: PvZ-Portable **0.2.5**, revisión `141c1476dd462ac3526f796e303177616f4de6bc`.
  Se incluye su WebAssembly real, JavaScript de Emscripten, importador y JSZip local. No se ha sustituido el
  combate por el motor anterior de 40 niveles. Los recursos GOTY no vienen en el repositorio: hacen falta
  `main.pak` y `properties/`, importados por carpeta o ZIP. Se conservan localmente para las siguientes entradas.
- `jardin.html?modo=pvz2`: Gardendless **0.16.0**, revisión `53d2ebb3ec51d1f69e9f906a5c4f70a5864dbfc6`.
  Se incluyen sus módulos de juego completos, Cocos 3.8.4, Spine, Bullet, configuración y paquetes de arranque.
  No se ha recortado el catálogo ni reescrito sus habilidades. Aproximadamente 1,3 GiB del repositorio original
  se sirven desde esa revisión fija: recursos de unidades, escenarios y audio se solicitan cuando se usan.
  Una caché del navegador guarda los recursos compatibles si la plataforma lo admite; no almacena rangos de audio. Esto **no es una copia
  completa sin conexión**; necesita red para los recursos que todavía no tiene. No se ejecutan anuncios ni Analytics.
- Los dos tienen entrada desde **Minijuegos**, controles redondos de regreso/pausa/pantalla y mantienen su interfaz
  propia. La interfaz de Gardendless de esta versión ofrece inglés/chino; no se presenta como traducida al español.
- Los perfiles están separados: `semilla-pvz1-pareja:`, `semilla-pvz1-amigos:`, `semilla-pvz2-pareja:` y
  `semilla-pvz2-amigos:`. Se prefijan localStorage e IndexedDB antes de cargar código del motor. Limpiar un
  almacén no limpia los demás. En Portable, un combate en curso debe salir mediante el menú nativo: ese
  cierre llama a `ShutdownHook/TryToSaveGame`. El botón exterior evita destruir una partida activa sin ese
  paso. El callback nativo sincroniza el filesystem antes de regresar al jardín. Gardendless guarda su perfil
  mediante su función propia; ese perfil no es una instantánea completa del combate. No se concede progreso
  territorial por ganar estos minijuegos.
- Se conservan la aventura anterior de 40 niveles, los patios, el duelo, la historia V2 y sus claves.

## Código de terceros y cambios

Los archivos están en `juego/web/public/jardin/motores/`. `motores.lock.json` fija versiones, revisiones,
tamaños y SHA-256 de cada archivo local. Portable conserva LGPL-3.0-or-later y GPL-3.0, su distribución
WebAssembly original y el archivo de fuentes exactas `fuentes-0.2.5.tar.gz`. JSZip 3.10.1 conserva su licencia.
Gardendless conserva Apache-2.0, el README y los créditos del juego. No se trasladan al motor Apache los
términos de sus recursos de terceros.

Cambios sobre los distribuibles:

1. Portable mantiene `pvz-portable.html` original; `index.html` agrega `perfil.js`, JSZip local y los adaptadores
   propios de interfaz/importación. La persistencia de recursos contiene archivos elegidos por el usuario;
   no se suben a un servidor ni se incorporan a Git.
2. En Cocos se cambia una asignación del cargador de paquetes: la base de datos/imagenes del paquete `resources`
   apunta a la revisión remota fija. El módulo JavaScript del paquete y el motor siguen locales. Los paquetes
   `internal` y `main` conservan sus rutas locales.
3. `game-audio.js` lee el manifiesto local y las pistas desde esa misma revisión. `index.js` comunica inicio/error
   al contenedor. El puente web mantiene el editor/almacén de niveles y limita enlaces externos a HTTPS.
4. El HTML de arranque propio omite los cargadores de publicidad/telemetría. El service worker tiene alcance
   solo dentro de `pvz2/` y solo almacena peticiones GET de recursos públicos de la revisión fijada.

## Motor para adaptar a historia · decisión revisada

La primera preferencia fue Portable por su fuente de combate y guardados a mitad de partida. Esa elección
dependía de recursos que no están en el repositorio. Con la confirmación de Javier, **Gardendless pasa a
candidato principal para adaptar la historia**, pues su motor y recursos ya permiten ejecutar y comprobar
combates completos. Portable queda como minijuego opcional pendiente de un paquete compatible.

Se comprobó también el inventario del Haxe Engine aportado: 423 archivos en `assets/`, una definición de
planta y seis de zombis, sin PAK, `properties/` ni `resources.xml` de Portable. Sus gráficos y sonidos sueltos
no constituyen un paquete completo que pueda importarse sin conversión. No resuelven por sí solos el arranque
de PvZ-Portable. Los recursos propios del Jardín tampoco se presentan como un paquete GOTY terminado.

La inspección detectó límites concretos: Portable define `MAX_GRID_SIZE_Y = 6`, tiene una aplicación/tablero
principal y bucle global; Gardendless usa bucles fijos de cinco carriles en varios sistemas y no expone una
instantánea completa de combate equivalente. Cambiar solamente un número o crear varios lienzos no resuelve
los ataques de varios frentes. No se presenta ninguno como sustituto territorial ya terminado.

Trabajo necesario antes de conectar el motor nuevo a la historia:

- Exponer crear/tablero, órdenes legales, paso fijo, pausa, resultado, exportación y restauración desde Cocos.
- Separar estado del tablero, RNG, perfil, interfaces, animaciones y eventos programados; comprobar varios frentes con
  una sola autoridad y sin avanzar el tablero según cuál se vea.
- Parametrizar de tres a siete o más carriles, geometría, selección de fila, agua y serialización. Mantener el
  comportamiento original de los minijuegos con cinco/seis carriles.
- Aplicar reservas de tipos y equipos a las órdenes de siembra, conservar las defensas entre incursiones y
  versionar la migración V2 sin borrar el original ni conceder recursos.
- Conservar las habilidades del motor e integrar las unidades faltantes de PvZ 1/Fusión con pruebas por unidad; sustituir
  los recursos por el arte propio al adaptar pistas, pivotes y animaciones.

La historia publicada sigue usando su motor territorial anterior mientras se construye y comprueba ese puente.
El catálogo de ambos minijuegos y la migración territorial son trabajos distintos. La ausencia de recursos
compatibles sigue impidiendo certificar una partida real de Portable; no bloquea el trabajo sobre Gardendless
ni convierte su motor actual en una migración ya realizada. La historia no requiere que Javier consiga GOTY.

## Evidencia y límites

Se inicializó el WASM real de Portable sin recursos externos y se inspeccionaron FS, IDBFS y su importador.
Gardendless entró al tutorial `tutorial1`, se plantaron dos lanzaguisantes y se recogieron soles mediante controles
normales; la oleada final terminó con `gameWon: true`, `currentWave: 3` y `tutorial1.progress: 3`, sin cambiar
daño, recursos ni relojes del motor. El reloj registró 305,9494 s incluyendo las esperas de inspección del tutorial.
Capturas en `juego/web/test-results/motores-originales/`.

`scripts/probar-motores-originales.mjs` comprueba arranque, pausa, siembra real de Gardendless, cierre y
aislamiento de almacenes. La persistencia de Portable usa bytes preparados en contexto de prueba: no acredita
una partida real sin recursos GOTY. La victoria observada de Gardendless tampoco certifica todos sus mundos,
todo el catálogo, ejecución sin conexión ni rendimiento de la APK.

### Comprobaciones de cierre

Pasaron las siete comprobaciones de navegador de los dos adaptadores, los 49 archivos fijados por SHA-256,
la prueba que impide ampliar las excepciones del filtro de amigos, los motores existentes y las 48 suites de
granja. Las compilaciones de pareja y amigos terminaron correctamente; el filtro revisó 651 archivos sin
contenido de la pareja. El recorrido integrado del último build pasó seis controles sin errores de página ni
recursos fallidos, con dibujo por captura y sesión aislada. No se ejecutaron instaladores ni dispositivos físicos.

El filtro admite los términos públicos «Halloween» e «iPhone» únicamente en cuatro archivos de Gardendless
cuyos hashes coinciden con los revisados. El resto de palabras y frases personales continúa comprobándose;
una modificación de esos archivos o una página auxiliar no declarada hace fallar la verificación.
