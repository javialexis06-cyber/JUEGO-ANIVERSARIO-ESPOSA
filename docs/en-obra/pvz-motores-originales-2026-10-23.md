# PvZ 1 y PvZ 2 · motores originales como minijuegos

23 de octubre de 2026. Javier pidió usar PvZ-Portable y Gardendless con sus propios combates, animaciones,
oleadas, habilidades y modos; cada uno debe ser un minijuego independiente. La historia territorial debe
adaptar el motor que mejor permita frentes simultáneos, reservas exclusivas y carriles por escenario.
Este pedido sustituye el uso de esos proyectos únicamente como referencia. Los mundos nuevos siguen pausados.

**Aclaración posterior del usuario:** Javier no tiene `main.pak` ni `properties/`. No esperar esos archivos
ni volver a pedírselos para avanzar la historia. Gardendless conecta ya casa y estación con sus
recursos; la ampliación territorial y la instantánea activa completa siguen pendientes. El minijuego PvZ 1 sigue encargado y conserva su entrada
e importador, pero todavía necesita una solución de recursos compatible para ser jugable sin aportes del usuario.

**Recursos remotos de PvZ 1 (29–30 de octubre).** Javier pidió conectarlo con datos de GitHub. El adaptador
descarga `main.pak` y `properties/` de `ruslan831/PlantsVsZombies-decompilation`, commit `325b2229…`
(`motores.lock.json → pvz1.datosRemotos`), y los guarda en IndexedDB. Ese paquete es **anterior a GOTY**: solo trae
animaciones y partículas precompiladas y su `resources.xml` no tiene lo que GOTY agregó. Al pulsar «¡A jugar!»:

- copia los 250 `compiled/*.compiled` del paquete como archivos sueltos (PvZ-Portable los lee así, con el mismo
  formato de 32 bits) y crea cinco alias de nombres cambiados en GOTY (IceShroom, TwinSunflower, bailarines y
  cabeza de Zombatar);
- genera un `resources.xml` con los grupos que exige PvZ-Portable (`pvz1/grupos-goty.json`, sacado de sus fuentes
  0.2.5 con `scripts/pvz1/grupos-goty.py`) y renombra en memoria la entrada antigua del paquete. Los 266 recursos
  que GOTY agregó (Zombatar, logros, juego rápido, notas nuevas) usan una imagen en blanco, una fuente o un sonido
  existentes: **esas pantallas se verán incompletas**, y los textos que cambiaron de clave pueden faltar.

Comprobado con `npm run probar:pvz1:datos` (ver el documento de la campaña de 240 áreas).

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
motor del primer sector conectado de historia**, pues su motor y recursos ya permiten ejecutar y comprobar
combates completos. El minijuego PvZ 1 permanece pendiente de un paquete compatible; no se descarta.

Se comprobó también el inventario del Haxe Engine aportado: 423 archivos en `assets/`, una definición de
planta y seis de zombis, sin PAK, `properties/` ni `resources.xml` de Portable. Sus gráficos y sonidos sueltos
no constituyen un paquete completo que pueda importarse sin conversión. No resuelven por sí solos el arranque
de PvZ-Portable. Los recursos propios del Jardín tampoco se presentan como un paquete GOTY terminado.

La inspección detectó límites concretos: Portable define `MAX_GRID_SIZE_Y = 6`, tiene una aplicación/tablero
principal y bucle global; Gardendless usa bucles fijos de cinco carriles en varios sistemas y no expone una
instantánea completa de combate equivalente. Cambiar solamente un número o crear varios lienzos no resuelve
los ataques de varios frentes. No se presenta ninguno como sustituto territorial ya terminado.

### Puente inicial de Gardendless

`src/jardin/motores/frente-gardendless.ts` y `public/jardin/motores/pvz2/frente.js` abren un combate mediante
`KeyListener.goToLevel`, sin simular pulsaciones en el menú ni modificar el paquete de habilidades del motor.
La entrada de revisión está en **Minijuegos → Prueba de integración · Gardendless**
(`jardin.html?modo=prueba-frente`): muestra el fondo ilustrado y controles redondos,
y carga el tutorial original después de pulsar «Jugar la prueba». No sustituye el inicio de cinco carriles de
la historia: `tutorial1` conserva su único carril activo y su progresión nativa.

El puente admite iniciar una vez, observar reloj/oleada/soles/recuento de unidades, pausar, reanudar, recibir
un resultado único y cerrar. Cada petición comprueba origen, ventana, zona, sesión y correlación; una segunda
carga se rechaza para evitar reinicios que borren daño. Los errores y la cancelación rechazan las esperas y
liberan la instancia. Solo admite este nivel comprobado; no carga niveles arbitrarios ni concede recompensas.

El perfil de un frente vive **en memoria** y sus bases auxiliares tienen un prefijo de sesión independiente
de los minijuegos y de V2. Cerrar la prueba descarta ese combate: no produce un supuesto guardado a partir de
los contadores observados. Las capacidades declaran expresamente `instantaneas: false`,
`carrilesVariables: false` y `pasoExterno: false`. No hay migración ni persistencia territorial nueva.

`npm run probar:pvz:frente-original` ejecuta una partida completa con selección, siembra, soles y oleadas
nativas, comprueba que la pausa congela reloj/oleada y valida el aislamiento de perfiles y la cancelación.
Las capturas y el resultado se escriben en `test-results/frente-gardendless/`. Es una prueba sobre Vite
porque importa el cliente TypeScript para verificar su contrato; la entrada de revisión también se compila
en pareja y amigos. No acredita todos los niveles, frentes simultáneos ni rendimiento físico.

El recorrido del puente pasó diez comprobaciones: victoria a los **101,6894 s** del reloj nativo, tercera
oleada, dos plantas y ningún zombi restante. No se concedieron soles ni se aceleró el reloj. También verificó
el cierre de una base auxiliar preparada, el perfil temporal de amigos y salir durante la carga. El contrato
preparado de `npm run probar:pvz:puente-original` cubre mensajes ajenos, reinicio, órdenes no admitidas y un
único resultado aunque la interfaz nativa cambie de nivel; no se presenta esa prueba preparada como combate.
El recorrido de los minijuegos originales conservó sus siete comprobaciones sin errores de página o recursos.
Pasaron los motores existentes, las 48 suites de granja y ambos builds; el filtro de amigos revisó 653
archivos. La entrada desde Minijuegos, el perfil temporal y la salida durante la carga se comprobaron en
ambos builds a 844 × 390. Los 50 archivos locales del distribuible y sus adaptadores coinciden con el lock.
El recorrido integrado final pasó seis controles sin errores de página ni recursos, en contexto aislado y
con dibujo por captura; no mide rendimiento de un teléfono.

### Primera conexión territorial posterior

La entrada **Historia** abre ahora casa → mapa → estación con Gardendless, sus estadísticas originales
aprobadas por Javier, equipos exclusivos y dos frentes vivos. V2 se conserva explícitamente en Minijuegos.
Ver [contrato, guardado entre combates y límites](pvz-historia-nativa.md). El puente de historia declara
`pasoExterno: true` y `puntosDescanso: true`; sigue declarando `instantaneas: false`. La prueba de tutorial
anterior conserva sus capacidades y su función independiente.

Trabajo restante para ampliar la adaptación más allá de este primer sector:

- Ampliar el puente de inicio/observación/pausa/resultado a órdenes legales, paso fijo, exportación y restauración
  completas desde Cocos. La instancia aislada de tutorial no sustituye ese contrato.
- Separar estado del tablero, RNG, perfil, interfaces, animaciones y eventos programados; comprobar varios frentes con
  una sola autoridad y sin avanzar el tablero según cuál se vea.
- Parametrizar de tres a siete o más carriles, geometría, selección de fila, agua y serialización. Mantener el
  comportamiento original de los minijuegos con cinco/seis carriles.
- Aplicar reservas de tipos y equipos a las órdenes de siembra, conservar las defensas entre incursiones y
  versionar la migración V2 sin borrar el original ni conceder recursos.
- Conservar las habilidades del motor e integrar las unidades faltantes de PvZ 1/Fusión con pruebas por unidad; sustituir
  los recursos por el arte propio al adaptar pistas, pivotes y animaciones.

El primer sector publicado usa el motor nativo. La historia territorial anterior permanece en `modo=historia-v2`,
sin conversión automática; el primer sector no sustituye sus doce escenarios ni su guardado activo completo.
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

En el cierre inicial de los minijuegos pasaron las siete comprobaciones de navegador de los dos adaptadores, los 49 archivos fijados por SHA-256,
la prueba que impide ampliar las excepciones del filtro de amigos, los motores existentes y las 48 suites de
granja. Las compilaciones de pareja y amigos terminaron correctamente; el filtro revisó 651 archivos sin
contenido de la pareja. El recorrido integrado del último build pasó seis controles sin errores de página ni
recursos fallidos, con dibujo por captura y sesión aislada. No se ejecutaron instaladores ni dispositivos físicos.

El filtro admite los términos públicos «Halloween» e «iPhone» únicamente en cuatro archivos de Gardendless
cuyos hashes coinciden con los revisados. El resto de palabras y frases personales continúa comprobándose;
una modificación de esos archivos o una página auxiliar no declarada hace fallar la verificación.
