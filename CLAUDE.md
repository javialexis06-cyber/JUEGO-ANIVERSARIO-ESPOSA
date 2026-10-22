# Guía de trabajo · Nuestro Hogar

## Alcance vigente

Prioridad del 22 de octubre: entregar la base jugable de Conquista que Javier pidió para decidir tras jugar.
Historia desde la casa hasta purificar el 100% y huida del Dr. Zomboid en nave; fusiones al final de historia
y desde el comienzo en versus. Navegar mediante mapas de mundo/país/ciudad, sin paneles superior, inferior
ni lateral; controles redondos pequeños y portada/final con detalle ilustrado. Conservar PvZ y patios como minijuegos. Ver
`docs/en-obra/pvz-conquista-base-2026-10-22.md` y el diseño territorial. Los perfiles nuevos son provisionales
y propios del prototipo; no modificar el balance anterior. El catálogo pendiente sigue pausado.

La cola y las decisiones actuales están en [docs/pedidos.md](docs/pedidos.md). El encargo del 16 de octubre quedó
completado: poses y predicción de Torneo, icono y salas de desafíos de Carreras y limpieza del repositorio.
Ampliación implementada y comprobada: El Escudo y Desaparecidos con doce mapas/casos, los 16 juegos mentales
del patio con reto diario y Jardín de los Desvelados con doce patios. Solo falta conectar Supabase y aplicar
la clasificación real; la prueba temporal no acredita ese despliegue. Ver `docs/pedidos.md`.
Las voces nuevas fueron descartadas expresamente. La granja quedó congelada (17 de octubre): no modificar sus sistemas, historia,
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
los cuarenta niveles construidos, selección, guardado, almanaque y controles; los patios clásicos y el duelo
conservan sus motores y claves. Ver `docs/en-obra/pvz-arte-2026-10-22.md` y los contratos de
`docs/en-obra/pvz-arquitectura.md`. Los mundos 5–10 y demás modos del plan siguen pendientes; no confundir
las animaciones procedurales actuales con animación independiente de cada extremidad.
