# Motor del mundo de niebla · 22 de octubre de 2026

El motor incorpora 4-1 a 4-10, ocho plantas y cuatro enemigos especiales de la primera aventura de PvZ 1
para PC. Incluye las tres etapas de Rompejarrones y la cinta final con tormenta. El catálogo suma cuarenta
niveles. Codex mantiene motor, datos, persistencia y pruebas; toda la presentación sigue a cargo de Claude.
Los patios clásicos, el duelo y la granja no se modifican.

Los [parámetros, fuentes y límites](pvz-niebla-fuentes-2026-10-22.md) distinguen reglas de PC de las
aproximaciones puntuales del motor. No se añaden recursos originales ni se retocan estadísticas para ganar
las simulaciones. El piloto mejora su selección de seis sobres, producción de sol, cobertura acuática,
reservas, uso de pala y respuestas a enemigos especiales mediante los controles ordinarios.

## Contrato para la vista

Los cambios aditivos están detallados en la [arquitectura](pvz-arquitectura.md). `EstadoPvZ.niebla` informa
la columna inicial, desplazamiento, tiempo restante de retirada y celdas iluminadas. `tormenta` informa
variante, contador y claridad. Son datos de simulación: Claude decide cómo dibujar niebla y relámpagos.

Rompejarrones publica `jarrones`, `sobres` y `etapaJarrones`, con órdenes `romperJarron` y `plantarSobre`.
El contenido de un jarrón solo es visible si es verde o está iluminado por Planterna. Los sobres tienen ID
y vida restante; una orden inválida no los consume. Los eventos anuncian rotura, sobre, caducidad y transición.
Ni el consumidor ni el piloto reciben el mapa privado de contenidos.

Los proyectiles ahora pueden ir hacia atrás, en vertical y en diagonal; `aereo` distingue los pinchos altos
del Cactus. Los estados de enemigos señalan vuelo, pérdida del globo, caja abierta o retirada, túnel,
emergencia, mareo, regreso, pérdida del pico y pérdida del saltador. La barrera alta y el imán detienen el
salto continuo; las defensas ordinarias no bloquean a un globo. Las reglas de frío, explosiones y plantas
anteriores respetan los nuevos objetivos aéreos o subterráneos.

## Guardado

El final publicado de treinta victorias con `nivelAlcanzado:'3-10'` se reconoce junto a las fronteras de diez
y veinte. Ofrece 4-1 sin escribir al leer ni conceder triunfos. Conserva monedas, compras, ranuras, ajustes,
modos, objetos, notas y las claves anteriores. Estructuras incoherentes siguen bloqueadas sin sobrescritura.
El final de 4-10 guarda Coltapulta como premio futuro sin ofrecer un sobre aún no registrado.

La selección del jugador debe pasarse explícitamente a `abrirNivel`. El piloto solo acredita partidas
automáticas legales; inspecciona el estado del motor y no juega mirando una imagen cubierta por niebla.
El arnés de Chromium prueba `localStorage` real y recargas, no una interfaz nueva de aventura.

## Comprobaciones

Pasan 49 reglas preparadas de Niebla: 24 de plantas y 25 de terreno, enemigos y jarrones. Incluyen la
separación de disparos aéreos, estrellas entre filas, ráfagas traseras, cubiertas, imán, fases del minero,
caja sorpresa, salto continuo, privacidad del contenido, caducidad de sobres y las tres tandas. La revisión
contrasta las máscaras de daño: Petacereza, Jalapeño, Petaseta y Patatapum alcanzan al minero en el túnel;
Apisonaflor no lo alcanza, tampoco por daño colateral, ni aplasta globos.

El piloto completa treinta partidas de Niebla (diez niveles con semillas 1, 23 y 108). Se auditan selección,
sol recogido y gastado, seis ranuras, órdenes ordinarias, casillas, victoria única e inmutabilidad tras el fin.
Las regresiones de día, noche y piscina mantienen sus noventa victorias; son 120 campañas simuladas en total.
Las 62 comprobaciones de guardado incluyen otras cuarenta victorias consecutivas con escritura y recarga
tras cada nivel. Pasan 24 comprobaciones de las tres fronteras publicadas y 19 en Chromium con almacenamiento
real, incluida 4-1 seguida de recarga con 4-2 disponible.

Pasan `probar:motores`, la repetición final de `probar:pvz` tras corregir interacciones subterráneas, las 48
suites existentes de `probar:granja`, TypeScript, `verificar:repo` y las compilaciones completa y de amigos
con su filtro. La integración del build servido completa sus seis comprobaciones funcionales en un Chromium
aislado, sin errores de página ni recursos fallidos. Se usa software gráfico, `DIBUJO_POR_CAPTURA=1`, modo
bajo de casa y viewport 844 × 390; la captura final muestra escenario 3D y HUD. No se modifica la granja.

La evidencia se conserva localmente fuera de git en `juego/web/test-results/pvz/`, con cierre separado en
`cierre-niebla-2026-10-22/`. Los intentos fallidos de desarrollo permanecen separados de las comprobaciones
finales. El piloto inspecciona estado completo: no certifica destreza con niebla, animaciones, interfaz de
aventura ni rendimiento de teléfonos. La captura de integración 3D pertenece a la regresión existente,
no a la nueva aventura de PvZ.

La integración visual de la aventura, los mundos 5–10, tienda, modos posteriores y Fusión siguen pendientes
conforme al [plan](jardin-plan-2026-10-17.md).
