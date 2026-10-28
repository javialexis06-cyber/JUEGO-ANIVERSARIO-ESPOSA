# Guía de trabajo · Nuestro Hogar

## Pedido vigente · versus de dos personas con Gardendless

El 28 de octubre Javier pidió terminar Historia y Versus: probar y pulir lo actual, y un Versus sobre Gardendless para
dos personas (plantas contra zombis, en un dispositivo o por sala). Ver [versus nativo](docs/en-obra/pvz-versus-nativo.md).
Cerebros, costes, recargas y duración del versus son provisionales hasta que Javier los apruebe.

## Pedido vigente · ampliar la historia al mapa existente

El 24 de octubre Javier autorizó extender Gardendless a las doce zonas del mapa. Esto sustituye la pausa
anterior para ese recorrido; la campaña futura de 240 áreas sigue pendiente. Conservar la presentación y
balance nativos, reservas exclusivas por tipo, defensas persistentes, mapas y guardados existentes.
Aprobó Pirata espadachín, Cabezaladrillo, Breakdancer y Flor de hielo como sustituciones nativas concretas.
Ver [ampliación y límites](docs/en-obra/pvz-mapa-nativo-2026-10-24.md). No anunciar una campaña ganada por pasar casos
preparados ni una instantánea a mitad de combate. No cambiar balance adicional sin aprobación.

## Pedido vigente · precarga y controles de Gardendless

Javier pidió conservar por ahora el arte, las animaciones, sonidos y reglas nativos de Gardendless.
La adaptación del arte propio y del banco ElevenLabs a este motor queda pausada; V2/aventura conservan lo integrado.
Preparar en paralelo los campos del sector mientras se muestran Dave y el mapa, conservar sus motores entre
ataques y al cambiar de zona, y evitar pantallas de carga al entrar a un campo preparado. La descarga inicial
sigue dependiendo de red/caché; no prometer que un dispositivo sin recursos pueda cargarlos instantáneamente.
Permitir arrastrar/soltar y seleccionar/colocar con dos clics o toques, usando costes, recargas y casillas nativos.
La ampliación posterior de las doce zonas se rige por el pedido vigente de arriba. No cambiar balance adicional.

## Pedido vigente · motores PvZ 1 y PvZ 2

Javier pidió incorporar PvZ-Portable y Gardendless completos como minijuegos separados, y adaptar el motor
que más convenga a la historia. Ver [integración y límites reales](docs/en-obra/pvz-motores-originales-2026-10-23.md).
Esto sustituye su uso solo como referencia. Los dos distribuibles se incorporan con versiones/licencias fijadas;
Portable necesita datos compatibles y Javier confirmó que no tiene los archivos GOTY. No volver a pedírselos
ni bloquear la historia por ellos. Gardendless conecta las doce zonas existentes, con reservas exclusivas, hasta seis combates simultáneos
y puntos de descanso entre combates. Ver [conexión y límites](docs/en-obra/pvz-mapa-nativo-2026-10-24.md).
Javier aprobó expresamente el balance original de Gardendless; V2 mantiene sus reglas y claves anteriores. El minijuego PvZ 1
sigue encargado y pendiente de una solución de recursos compatible; no descartarlo ni exigir datos al usuario.
No afirmar migración ni catálogo completo por montar un minijuego.
Conservar guardados/perfiles y la aventura anterior. La ampliación del 24 de octubre sustituye la pausa para las doce zonas.
Existe un primer puente aislado de Gardendless (inicio, observación, pausa, resultado y cierre), revisable en
`jardin.html?modo=prueba-frente`. Usa un perfil temporal y se conserva aparte. La entrada Historia abre
`modo=historia` con las doce zonas nativas; `modo=historia-v2` conserva la historia anterior. No se migra V2.
El cierre a mitad de combate nativo exige repetir los ataques pendientes desde su inicio, con aviso explícito;
no anunciar una instantánea completa. La ampliación autorizada del 24 de octubre continúa ese sector en las doce zonas existentes.

## Base conservada · primer escenario y controles

Antes de la ampliación del 24 de octubre, Javier pausó nuevos mundos para cerrar el inicio, la interacción y la animación.
Ver [primer escenario y controles](docs/en-obra/pvz-principios-2026-10-23.md) y
[fuentes de motores aportadas](docs/en-obra/pvz-referencias-motores-2026-10-23.md).
Aprobó que las partidas nuevas defiendan primero La casa, conserven sus plantas y habiliten después
expediciones y contraataques. Conservar los V2 anteriores sin imponer ese prólogo ni cambiar sus reglas.
En el primer sector nativo se usa el balance original de Gardendless con aprobación expresa de Javier. Croquis sobre lugares dibujados, pala/semilla en mano y selección hacia una baraja.
El zombi base tiene un esqueleto de piezas propias para revisar; el resto del catálogo gráfico sigue pendiente.
El pedido del 24 de octubre autoriza ampliar el mapa existente con la presentación nativa.


## Pedido nuevo · audio y presentación del 23 de octubre

**Guía para Claude:** [docs/en-obra/pvz-elevenlabs-guia-claude.md](docs/en-obra/pvz-elevenlabs-guia-claude.md).
Javier encargó a Claude producir efectos, música y balbuceos no verbales de Dave con el saldo existente de
ElevenLabs; Codex integra reproducción, mapas, tutorial y animaciones. El manifiesto tiene 107 familias y
253 archivos, ya producidos por Claude e integrados por Codex en V2 y aventura. La primera conexión
nativa de Gardendless conserva su audio original; su adaptación allí queda pausada mientras se conserva la presentación nativa. Ver
[reproducción y presentación](docs/en-obra/pvz-presentacion-audio-2026-10-23.md). Este pedido sustituye la restricción de usar solo
WebAudio en el Jardín; las voces clonadas y los diálogos hablados del encargo anterior siguen descartados.
No comprar créditos ni habilitar sobrecostes. Conservar claves privadas fuera del código y de Git.
Zonas propias verdes y enemigas moradas con bordes legibles; animación de pasos, extremidades, daño y
protecciones; plantas con balanceo, proyectiles coherentes, terreno alineado y ambiente vivo. Ver el guion
`juego/web/src/jardin/conquista/tutorial-dave.ts`. La granja continúa pausada.


## Alcance vigente

Prioridad del 22 de octubre tras probar el jugable: defensas con mecánicas completas de PvZ y carriles
configurables por escenario (carreteras de tres/cuatro, casas con cinco, almacenes de seis/siete o lo que
requiera el mapa). Cada tipo completo de planta se reserva a una sola zona. Desbloquear plantas e introducir
zombis al llegar a zonas nuevas; completar comportamientos, arte y pruebas de PvZ 1, PvZ 2 y la última versión
verificada de Fusión. El catálogo y su arte se reanudan; la pausa gráfica anterior queda sustituida.
Ver `docs/en-obra/pvz-pendientes-2026-10-22.md` y el issue #1 de GitHub: el seguimiento contiene 180 tareas
con casillas de avance y evidencia. Ya existe el núcleo de carriles/instantáneas y coordinador de defensas;
ver `docs/en-obra/pvz-instancias-2026-10-23.md`. La historia ya conecta mapa y guardado V2;
ver `docs/en-obra/pvz-historia-integrada.md`. El localizador de reservas y las comprobaciones normales parciales
están en `docs/en-obra/pvz-reservas-y-presion-2026-10-23.md`; no certifican el balance de la campaña completa.
Salas nuevas y migración V1 siguen pendientes. Conservar historia desde casa hasta el 100%,
mapas mundo/país/ciudad, controles redondos,
PvZ y patios como minijuegos y sus partidas. El prototipo/versus anterior conserva su combate y claves en `modo=prototipo`; la historia nueva usa PvZ real.

La cola y las decisiones actuales están en [docs/pedidos.md](docs/pedidos.md). El encargo del 16 de octubre quedó
completado: poses y predicción de Torneo, icono y salas de desafíos de Carreras y limpieza del repositorio.
Ampliación implementada y comprobada: El Escudo y Desaparecidos con doce mapas/casos, los 16 juegos mentales
del patio con reto diario y Jardín de los Desvelados con doce patios. Solo falta conectar Supabase y aplicar
la clasificación real; la prueba temporal no acredita ese despliegue. Ver `docs/pedidos.md`.
Las voces clonadas y los diálogos hablados del encargo anterior fueron descartados expresamente. La granja quedó congelada (17 de octubre): no modificar sus sistemas, historia,
arte ni balance. Se permiten sus regresiones e integración existentes.
Pedido completado: gráficos reales del Jardín y dos jugadores, uno con plantas y otro con zombis, mediante salas
por código y en una pantalla. Probado en Realtime real y con pérdida/cortes simulados. Campaña conservada.
Encargo activo: el Jardín pasa a ser «Plantas contra Zombis: La Semilla Madre», con nombres, interfaz y
jugabilidad de PvZ e historia propia, más el modo Fusión aparte. Javier dio libertad de diseño. Ver
`docs/en-obra/jardin-plan-2026-10-17.md` y `docs/en-obra/pvz-arquitectura.md`.

No retomar instaladores/Actions, Supabase real, pruebas físicas ni ampliaciones de cobertura descartadas por
aparecer en notas antiguas. Las pruebas necesarias para los cambios actuales sí forman parte del encargo.
Las escenas premium no realizadas y el contenido futuro del sótano continúan descartados; conservar lo existente.

## Reglas de colaboración

- Responder, comentar y escribir commits en español claro. Trabajar hasta terminar el encargo autorizado.
- Dificultad, balance, precios, costes y recompensas requieren propuesta concreta y aprobación previa de Javier.
- Publicar los avances probados en `work` y `claude/supermarket-mania-minigame-xn2it8`: autorización vigente del chat.
  Traer cambios remotos antes de publicar, no usar push forzado ni abrir PR sin petición.
- Conservar partidas, claves, IDs y compras existentes. No reiniciar progreso ni conceder recursos para corregirlo.
- El repositorio es público. No añadir conversaciones privadas, teléfonos, datos de salud ni credenciales.
  Las claves privadas solo van en variables del entorno; nunca en archivos, commits ni mensajes.
- La versión de amigos no puede incluir contenido de la pareja. Usar los sustitutos de `vite.config.ts` y pasar su filtro.
- No crear frentes o agentes sin autorización. Para tareas independientes, agrupar lecturas y comprobaciones compatibles.
- Consultar solo la documentación de los sistemas afectados. El historial no genera nuevas tareas.

## Referencias

- [README](README.md): estructura, páginas y puesta en marcha.
- [Índice de documentos](docs/README.md): sistemas, registros, referencias e historia.
- [La pareja](docs/la-pareja.md): nombres, tono y quién cuenta cada recuerdo; leer antes de crear textos personales.
- [Mitología](docs/mitologia.md): canon de Astra. La biblia de narrativa es una fuente, no prueba de implementación.
- [Coordinación de granja](docs/en-obra/granja-coordinacion.md): consultar únicamente si Javier reanuda ese trabajo.
- [Guía anterior archivada](docs/archivo/claude-hasta-2026-10-16.md): detalles de producción y decisiones históricas.

## Arquitectura y contratos

- `juego/web/src/`: Vite, TypeScript y three.js; [mapa de páginas](juego/web/README.md).
- `src/casa/`: cuidado, compras, sincronización y acceso a minijuegos. Los cambios compartidos pasan por las
  normalizaciones de `modelo.ts`; eventos y actualizaciones siguen las acciones de `sincro.ts`.
- `src/salas/`: perfiles, transporte y vestuario. El anfitrión confirma impactos y resultados en Torneo; en Carreras
  confirma objetos y puntuación compartida. Una predicción de vista no debe conceder daño ni recompensas.
- `src/granja-v3/`: único motor de granja, guardado V5. `src/granja-v2/biblioteca.ts` es un cargador visual.
  Mantener IDs, calendario, economía y contratos cuando se vuelva a autorizar ese frente.
- `public/`: recursos publicados. `modelos-crudos/`, builds y capturas se generan localmente y no se suben.
- `personajes/blender/`: fuentes de modelos y poses; [guía de recursos](personajes/README.md).
- `supabase/`: esquema y migraciones conservados como fuentes; no implica que estén desplegados.
- `juego/escritorio/`: empaquetado Electron. Android usa los dos proyectos Capacitor de `juego/web/`.

## Calidad y comprobación

Interfaz en español colombiano, horizontal y con controles legibles. Mantener las caras, el estilo de peluche y
los modelos existentes. Inspeccionar capturas cuando cambie presentación. Liberar recursos WebGL al salir de un juego.

Desde `juego/web/`:

```sh
npm ci
npm run verificar:repo
npm run probar:motores
npm run probar:granja
npm run build
npm run build:amigos
```

Ejecutar los checks pertinentes. Después de cambios integrados, servir el build completo y ejecutar
`scripts/granja-v3/verificar-demo.mjs` con contexto aislado. La granja participa solo en esa regresión.
Los recorridos de navegador de cada juego están en `scripts/probar-*.mjs`, con instrucciones en su cabecera.
Usar `CHROME_PATH` si el Chromium instalado no coincide con el de Playwright.

- Compilar antes de abrir recorridos sobre `dist`; no reemplazar los archivos mientras los consume el navegador.
- Usar Vite sin HMR cuando la prueba importe módulos fuente. Ejecutar los recorridos 3D de uno en uno en una máquina pequeña.
- Sin GPU: SwiftShader y dibujo por captura cuando lo permita el script. No confundir esa prueba con rendimiento de teléfono.
  `verificar-demo.mjs` aplica ese perfil desde la carga y usa el modo bajo de la casa; conserva los controles,
  relojes y estados del juego. No ejecutar el recorrido 3D junto a compilaciones o simulaciones pesadas.
- Contextos nuevos, nunca las cuentas ni partidas del usuario. Identificar escenarios preparados, pilotos y relojes acelerados.
- No declarar perfección ni todas las combinaciones comprobadas por pasar reglas o escenarios preparados.
- Logs y capturas van a `juego/web/test-results/`; temporales de scripts a `scripts/_*.mjs` (excluidos localmente).
- Al terminar: actualizar cola y documentos del sistema, revisar `git diff --check`, publicar y verificar ambas ramas.
  El seguimiento de instaladores sigue descartado salvo un nuevo pedido explícito.

El nuevo pedido sí autoriza habilitar y comprobar la clasificación del patio en Supabase. Limitarse a
`supabase/patio-clasificacion.sql`; no aplicar el SQL antiguo de la casa. Javier pidió que lo haga el agente.
Usar la conexión Supabase cuando esté autorizada, sin pedir al usuario escribir SQL ni pegar claves privadas.

El pedido gráfico del 22 de octubre sustituye el reparto anterior: Javier aprobó el estilo ilustrado y
encargó a Codex implementar plantas, escenarios y zombis con variedad de ropa. La aventura Canvas conecta
los cincuenta niveles construidos (mundo 5, el tejado, desde el 26 de octubre), selección, guardado, almanaque y controles; los patios clásicos y el duelo
conservan sus motores y claves. Ver `docs/en-obra/pvz-arte-2026-10-22.md` y los contratos de
`docs/en-obra/pvz-arquitectura.md`. Los mundos 6–10, la tienda y demás modos del plan siguen pendientes; no confundir
las animaciones procedurales actuales con animación independiente de cada extremidad.
