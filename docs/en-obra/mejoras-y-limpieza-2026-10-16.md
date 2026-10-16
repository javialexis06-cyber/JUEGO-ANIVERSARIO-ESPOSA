# Mejoras y limpieza · 16 de octubre de 2026

## Alcance

Javier autorizó completar las mejoras antes opcionales de Torneo y Carreras y revisar/ordenar/limpiar el
repositorio, sus README e instrucciones. En este mismo encargo descartó añadir voces nuevas. Se conserva todo el
audio anterior. La granja sigue pausada y no se retoman instaladores, Supabase real ni la ampliación general de
pruebas descartada en el cierre anterior. Los checks de los cambios actuales sí se ejecutan.

## Implementación

- **Torneo:** biblioteca de 51 poses horneadas por Blender, con espejos y golpe bajo propio. No reexporta cuerpos ni
  recursos de granja. Predicción de movimiento y pose del invitado con reglas compartidas, confirmación de controles
  y correcciones suavizadas. Impactos, vida y resultado siguen siendo del anfitrión; límites de extrapolación y
  descarte de paquetes antiguos o de otra pelea.
- **Carreras:** icono propio del cuarto y salas para Globos, Monedas, Anillos y Trucos. Opciones de escenario y
  duración visibles para ambos. El anfitrión confirma puntos, globos, recogibles y orden; maniobras contabilizadas
  una vez. Final fiable y marcas de sala separadas de las locales, sin nuevas recompensas ni cambios de reglas.
- **Repositorio:** README principal y guías de aplicación, recursos y Supabase; CLAUDE.md y AGENTS.md con un solo
  alcance vigente. Guía anterior archivada. Índice de documentación y README de narrativa/wiki con contexto histórico
  y granja pausada. Enlace roto de referencia corregido; protección de archivos locales y credenciales en gitignore.
- **Verificación de higiene:** `npm run verificar:repo` revisa los Markdown y JSON registrados, enlaces locales y
  exclusión de temporales. El workflow de motores usa filtros legibles que incluyen todos sus scripts de regresión.

## Evidencia obtenida

- Torneo: biblioteca y ambos espejos, respuesta local a 30/60/120 FPS, reconciliación con demora de 100/200 ms por
  trayecto, jitter y fotos perdidas; fin, impacto, controles antiguos y revancha. Pasan los 18 combates replicados
  y 400 cruces sin cambiar daño, física ni dificultad. Sala de navegador con pérdidas: ambos reciben el mismo final.
- Blender regenera las 51 poses con la misma huella SHA-256. Se capturaron 16 vistas de guardia, golpe bajo,
  fuerte y patada de ambos personajes por los dos lados, sin errores de página; capturas de ambos e icono revisados.
- Carreras: ocho partidas completas del motor en sala (cuatro desafíos × dos/cuatro jugadores), demora, pérdida de
  fotos y maniobras repetidas. Mismos puntos y clasificación, sin sumar dos veces ni aceptar fotos viejas tras el final.
- Carreras en interfaz: cuatro desafíos completos en amigos, dos perfiles aislados, pérdida del 6 %, demora de hasta
  160 ms y un corte recuperado. Mismos puntos/podios, marcas propias, retorno y recarga. Batalla completa en pareja
  con las mismas comprobaciones. Carrera clásica en dos pestañas con pérdida del 8 % y demora: tiempos y tabla
  idénticos tras corregir la presentación prematura del resultado invitado; podio y retorno correctos.
- El transporte del motor añade dos carreras clásicas, además de las ocho partidas de desafíos, y comprueba que
  llegar localmente no acredita la confirmación final. Reenviar una maniobra no vuelve a dar puntos.
- Ambas compilaciones pasan y el filtro de amigos revisa 579 archivos sin contenido de pareja.
- Las pruebas de motores pasan y la regresión de granja conserva 48 suites con cero fallos.
- Integración del build completo: seis comprobaciones, sin errores de página ni peticiones fallidas. Acceso desde
  casa, controles, correo, inventario, retorno y recarga conservan el guardado. No se modificó código ni arte de granja.
- La revisión de enlaces/JSON/temporales pasa: 258 documentos, 118 JSON y 399 enlaces locales, sin fallos.
  La documentación vigente distingue implementaciones, evidencia,
  archivo histórico y descartes; las notas antiguas no reabren tareas.

**Estado:** implementación, limpieza y verificaciones completadas. Sin cambios de dificultad, balance, precios,
costes ni recompensas. Voces nuevas descartadas y granja pausada. No quedan tareas activas de este encargo.
Los resultados y capturas locales están bajo `juego/web/test-results/mejoras-2026-10-16/`; scripts reproducibles en
`scripts/probar-carreras-red.mjs`, `probar-carreras-desafios-linea.mjs`, `probar-peleas-red.mjs` y `probar-peleas-poses.mjs`.
Las simulaciones y el dibujo por captura no certifican teléfonos físicos ni el servicio real.
