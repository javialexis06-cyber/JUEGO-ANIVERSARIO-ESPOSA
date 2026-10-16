# Trabajo en este repositorio

Cierre vigente del 16 de octubre: la revisión de juegos está terminada. Javier descartó generar nuevos
instaladores/reactivar Actions, validar SQL/Supabase real, pruebas físicas y toda ampliación de pruebas de recorridos,
desbloqueos, modos y combinaciones que se enumeró al cierre. No retomar esos puntos ni exigirlos para cerrar
este encargo. Conservar la evidencia de lo probado y sus límites. No hay otra tarea activa; las mejoras opcionales
documentadas no autorizan nuevo trabajo. La granja continúa pausada. Detalle en `docs/pedidos.md`.

Encargo vigente del 15 de octubre: limpiar documentación antigua y completar comprobaciones/correcciones de todos los juegos existentes. La granja está pausada: no modificar sus sistemas ni contenido. Se descartan las ampliaciones no realizadas de escenas premium y el contenido futuro del sótano; conservar lo implementado y los guardados. Las regresiones e integración existentes de granja se pueden ejecutar. Detalle en `docs/pedidos.md`.

Leer `CLAUDE.md` y, si se vuelve a autorizar trabajo en la granja, `docs/en-obra/granja-coordinacion.md`. El usuario pidió que el motor, sistemas e historia continúen en el frente de granja y los gráficos, personajes y presentación en el frente visual. No crear otro motor ni perder partidas.

Fuente activa: `juego/web/src/granja-v3/`. `src/granja-v2/biblioteca.ts` es solo el cargador visual. Guardado V5 y claves existentes. Conservar IDs, economía, genomas, huellas/puertas, calendario al dormir y cuidados reales. Usar las acciones del motor para cambios económicos.

Encargo vigente de Javier (13 de octubre de 2026): completar y corregir el motor de todos los juegos y probar partidas de inicio a fin. Antes de modificar dificultad, balance, precios, costes o recompensas, presentar la propuesta concreta y esperar su aprobación. Los arreglos funcionales y las pruebas continúan sin cambiar esas cifras. Registrar cobertura y pendientes en `docs/en-obra/auditoria-motores.md`; no afirmar que todo está perfecto por pasar pruebas de reglas o escenarios preparados.

Javier autorizó explícitamente en este chat publicar el registro `a3c4aa7e` y los siguientes avances de motor y pruebas en `work` y `claude/supermarket-mania-minigame-xn2it8` de este mismo repositorio público. Esa autorización permanece vigente; no volver a pedir permiso para cada commit de este encargo. Mantener la aprobación previa de dificultad y balance, traer cambios remotos y no usar push forzado.

Al cerrar cada avance: actualizar documentos, ejecutar las comprobaciones pertinentes y subir el commit a `claude/supermarket-mania-minigame-xn2it8`, por instrucción del usuario. Antes de publicar, traer cambios remotos y combinar trabajo paralelo sin push forzado. No abrir PR salvo petición. La comprobación y generación de instaladores de este cierre fue descartada expresamente el 16 de octubre; no reintentarlas por esta regla histórica.

Regresión del motor: `cd juego/web && npm run probar:granja`. Integración: `npm run build` y `npm run build:amigos`; después ejecutar `scripts/granja-v3/verificar-demo.mjs` contra el build completo servido, con un contexto aislado. Las pruebas visuales no certifican rendimiento físico de los teléfonos.

No presentar los NPC/mundos planificados como implementados ni declarar paridad completa mientras existan capacidades pendientes en `PLAN-MOTOR-COMPLETO.md`.
