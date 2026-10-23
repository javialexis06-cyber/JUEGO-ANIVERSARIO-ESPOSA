# Instrucciones del repositorio

Prioridad del 22 de octubre tras probar el jugable: defensas con mecánicas completas de PvZ y carriles
configurables por escenario (carreteras de tres/cuatro, casas con cinco, almacenes de seis/siete o lo que
requiera el mapa). Cada tipo completo de planta se reserva a una sola zona. Desbloquear plantas e introducir
zombis al llegar a zonas nuevas; completar comportamientos, arte y pruebas de PvZ 1, PvZ 2 y la última versión
verificada de Fusión. El catálogo y su arte se reanudan; la pausa gráfica anterior queda sustituida.
Ver `docs/en-obra/pvz-pendientes-2026-10-22.md` y el issue #1 de GitHub: el seguimiento contiene 180 tareas
con casillas de avance y evidencia. Ya existe el núcleo de carriles/instantáneas y coordinador de defensas;
ver `docs/en-obra/pvz-instancias-2026-10-23.md`. Su conexión con mapa, guardado territorial y salas sigue
pendiente. Conservar historia desde casa hasta el 100%, mapas mundo/país/ciudad, controles redondos,
PvZ y patios como minijuegos y sus partidas. El prototipo publicado aún usa su combate simplificado.

Leer [CLAUDE.md](CLAUDE.md). La cola vigente está en [docs/pedidos.md](docs/pedidos.md); las notas históricas no la sustituyen.

Encargo del 16 de octubre completado: poses y predicción del invitado en Torneo, icono y salas para los cuatro
desafíos de Carreras, y revisión/orden/limpieza del repositorio y su documentación. **Voces nuevas descartadas.**
Ampliación implementada y comprobada: El Escudo y Desaparecidos con doce mapas/casos, los 16 juegos mentales
del patio con reto diario y Jardín de los Desvelados con doce patios. Solo falta conectar Supabase y aplicar
la clasificación real; la prueba temporal no acredita ese despliegue. Ver `docs/pedidos.md`.
**Granja congelada (17 de octubre):** no modificar sus sistemas, historia, arte ni balance; solo regresiones e integración existentes.
Pedido completado: gráficos reales del Jardín y dos jugadores, uno con plantas y otro con zombis, mediante salas
por código y en una pantalla. Probado en Realtime real y con pérdida/cortes simulados. Campaña conservada.
Encargo activo: el Jardín pasa a ser «Plantas contra Zombis: La Semilla Madre», con nombres, interfaz y
jugabilidad de PvZ e historia propia, más el modo Fusión aparte. Javier dio libertad de diseño. Ver
`docs/en-obra/jardin-plan-2026-10-17.md` y `docs/en-obra/pvz-arquitectura.md`.
Los descartes anteriores de instaladores, Supabase real y pruebas adicionales siguen vigentes.

Conservar IDs, claves, partidas y compras. Antes de tocar dificultad, balance, costes, precios o recompensas,
presentar la propuesta y esperar aprobación. Los arreglos funcionales y pruebas de cambios autorizados continúan.

Javier autorizó en este chat publicar los avances en `work` y `claude/supermarket-mania-minigame-xn2it8` del
repositorio público actual. Traer cambios remotos, combinar trabajo sin push forzado, actualizar documentos y
publicar al cerrar cada avance. No pedir otra vez ese permiso ni abrir PR sin petición. La generación y seguimiento
de instaladores fue descartada; no reabrirla por instrucciones antiguas.

Comprobaciones desde `juego/web/`: `npm run verificar:repo`, pruebas de los sistemas afectados,
`npm run probar:motores`, `npm run probar:granja`, `npm run build` y `npm run build:amigos`. Ejecutar
`scripts/granja-v3/verificar-demo.mjs` sobre el build completo servido con un contexto aislado cuando haya
cambios integrados. Una comprobación de navegador no certifica rendimiento o sensores físicos.

Fuente única de granja: `juego/web/src/granja-v3/`; guardado V5. El cargador de `src/granja-v2/biblioteca.ts` no es otro motor.
Si se autoriza reanudarla, leer primero `docs/en-obra/granja-coordinacion.md` y sus contratos; no presentar los planes como implementados.

El nuevo pedido sí autoriza habilitar y comprobar la clasificación del patio en Supabase. Limitarse a
`supabase/patio-clasificacion.sql`; no aplicar el SQL antiguo de la casa. Javier pidió que lo haga el agente.
Usar la conexión Supabase cuando esté autorizada, sin pedir al usuario escribir SQL ni pegar claves privadas.

El pedido gráfico del 22 de octubre sustituye el reparto anterior: Javier aprobó el estilo ilustrado y
encargó a Codex implementar plantas, escenarios y zombis con variedad de ropa. La aventura Canvas conecta
los cuarenta niveles construidos, selección, guardado, almanaque y controles; los patios clásicos y el duelo
conservan sus motores y claves. Ver `docs/en-obra/pvz-arte-2026-10-22.md` y los contratos de
`docs/en-obra/pvz-arquitectura.md`. Los mundos 5–10 y demás modos del plan siguen pendientes; no confundir
las animaciones procedurales actuales con animación independiente de cada extremidad.
