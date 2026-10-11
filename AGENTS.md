# Trabajo en este repositorio

Leer `CLAUDE.md` y, para la granja, `docs/en-obra/granja-coordinacion.md`. El usuario pidió que el motor, sistemas e historia continúen en el frente de granja y los gráficos, personajes y presentación en el frente visual. No crear otro motor ni perder partidas.

Fuente activa: `juego/web/src/granja-v3/`. `src/granja-v2/biblioteca.ts` es solo el cargador visual. Guardado V5 y claves existentes. Conservar IDs, economía, genomas, huellas/puertas, calendario al dormir y cuidados reales. Usar las acciones del motor para cambios económicos.

Al cerrar cada avance: actualizar documentos, ejecutar las comprobaciones pertinentes y subir el commit a `claude/supermarket-mania-minigame-xn2it8`, por instrucción del usuario. Antes de publicar, traer cambios remotos y combinar trabajo paralelo sin push forzado. No abrir PR salvo petición. Comprobar el workflow «APK Android» del commit publicado.

Regresión del motor: `cd juego/web && npm run probar:granja`. Integración: `npm run build` y `npm run build:amigos`; después ejecutar `scripts/granja-v3/verificar-demo.mjs` contra el build completo servido, con un contexto aislado. Las pruebas visuales no certifican rendimiento físico de los teléfonos.

No presentar los NPC/mundos planificados como implementados ni declarar paridad completa mientras existan capacidades pendientes en `PLAN-MOTOR-COMPLETO.md`.
