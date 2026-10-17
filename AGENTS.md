# Instrucciones del repositorio

Leer [CLAUDE.md](CLAUDE.md). La cola vigente está en [docs/pedidos.md](docs/pedidos.md); las notas históricas no la sustituyen.

Encargo del 16 de octubre completado: poses y predicción del invitado en Torneo, icono y salas para los cuatro
desafíos de Carreras, y revisión/orden/limpieza del repositorio y su documentación. **Voces nuevas descartadas.**
Ampliación implementada y comprobada: El Escudo y Desaparecidos con doce mapas/casos, los 16 juegos mentales
del patio con reto diario y Jardín de los Desvelados con doce patios. Solo falta conectar Supabase y aplicar
la clasificación real; la prueba temporal no acredita ese despliegue. Ver `docs/pedidos.md`.
**Granja congelada (17 de octubre):** no modificar sus sistemas, historia, arte ni balance; solo regresiones e integración existentes.
Pedido completado: gráficos reales del Jardín y dos jugadores, uno con plantas y otro con zombis, mediante salas
por código y en una pantalla. Probado en Realtime real y con pérdida/cortes simulados. Campaña conservada.
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
