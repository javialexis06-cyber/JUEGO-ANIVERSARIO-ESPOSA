# Coordinación de la granja con el proyecto principal

## Mensaje para Claude · 10 de octubre de 2026

Javier pidió integrar en este repositorio todo el trabajo de la granja y subir cada avance comprobado. Estamos desarrollando su motor y jugabilidad sobre el mismo juego de Three.js, con sistemas de agricultura, ganadería, genética, fabricación, automatización, pueblos y aventura inspirados en la amplitud de Stardew Valley, Expanded y Automate, más la mitología de Astra. El motor completo todavía está en desarrollo.

El reparto solicitado para el frente de la granja es:

- **Frente de motor:** reglas, controles, inventario/barra, calendario y guardado, economía, producción, genética/cuidados, colisiones y accesos, NPC y misiones, historia y progresión, integración y pruebas. Este frente continúa desde la conversación donde se creó la granja.
- **Claude:** gráficos, diseño y modelos de personajes/NPC, animales y plantas, edificios, paisajes, decoración, texturas, iconos, animaciones y presentación visual. Mantiene también la casa y los demás juegos según la cola de Javier. El diseño final de objetos o funciones especiales de la casa se coordina con él.

Antes de modificar un archivo compartido, revisar el último commit remoto y comunicar el contrato visual o funcional en este documento. No crear otro motor ni sustituir las reglas para renovar los gráficos. Evitar borrar trabajo paralelo: incorporar los cambios recientes antes de publicar, resolver conflictos y repetir las comprobaciones afectadas. Sin push forzado.

## Fuente única y acceso

La fuente de trabajo integrada está en `juego/web/src/granja-v3/`; la página sigue siendo `granja-v3.html`. Se agrega al build de la pareja y al cuarto de juegos de la casa como «Nuestra granjita». No se agrega a la app de amigos en esta etapa. La entrada de la casa real conserva su sesión/economía y ofrece retorno a la posición guardada de la granja.

`src/granja-v2/biblioteca.ts` es únicamente el cargador de recursos visuales reutilizado. `public/modelos/granja-v2/` y `granja-v3/` son catálogos de arte, no motores ni partidas adicionales. Los generadores correspondientes están en `scripts/granja-v2/` y `scripts/granja-v3/`. No se integran las demos o motores antiguos, ZIP de entregas, builds generados, copias del juego comercial ni partidas de pruebas.

## Contrato para renovar el arte

Conservar IDs de objetos, cultivos, animales, NPC, edificios, regiones y animaciones. Guardado V5, claves actuales y migraciones continúan vigentes. Cambiar un ID requiere una migración real que conserve el progreso. Los modelos deben respetar escala, origen, pivotes, huellas y puertas; la vista recibe los resultados del motor y los anima, sin conceder monedas/objetos ni modificar genomas por su cuenta.

`vista.ts`, `avatar.ts`, `*-render.ts`, `suelo.ts`, `clima-render.ts` y `estilo.css` son zonas de encuentro entre ambos frentes. Los recursos de granja utilizan `manifest.json`, modelos ligeros y detallados, clips y pivotes. Para cambiar ese formato, acordar el contrato primero y conservar un modo de sustitución compatible. Personajes `src/personaje.ts` y el loader `src/recursos.ts` pertenecen al proyecto compartido: esta integración usa sus versiones actuales.

Destinos: S21 FE y S24 Ultra. La granja puede probarse con teclado y mouse y controles móviles. La app principal mantiene su orientación horizontal. Los ensayos de viewport no certifican rendimiento físico; faltan medidas en ambos dispositivos. Mantener reuso de geometría/materiales, carga por zona y límites de partículas, luces y draw calls.

## Estado real e historia

El catálogo integrado contiene 63 cultivos, ocho frutales, doce familias productivas y linajes fantásticos, 101 recetas, 416 objetos, 24 vecinos del primer pueblo, 17 viviendas y 24 dormitorios básicos. Hay calendario de 28 días, herramientas y habilidades, encargos, ocho encuentros sociales, correo, construcción y redes de producción. Consultar los documentos del módulo para reglas, API y límites de cada sistema.

La planificación propone 147 identidades en 19 núcleos: no son 147 NPC jugables ni 19 pueblos terminados. Los mundos de aventura tienen una primera base; faltan variedad regional, campaña, eventos comunitarios y muchas funciones de la auditoría. Los dormitorios comparten distribución. El siguiente bloque del motor previsto son los eventos comunitarios/festivales.

El lore recibido está en `docs/mitologia.md`. La planificación específica está en `PLAN-PUEBLOS-MUNDOS.md`, `REPARTO-COMPLETO.md` y `REPARTO-MUNDOS.json`, dentro del módulo. Distinguir canon de nombres/episodios propuestos. Nox no es un refugio de almas inocentes ni un ciclo de reencarnación; no rehacer el canon por una necesidad de arte. La casa, la granja y Sangre y Ceniza se coordinan; los minijuegos casuales permanecen independientes. No declarar equivalencia completa con Stardew/Expanded/Automate.

Días, estaciones, crecimiento de cultivos, edad de crías y avances de obra solo progresan al dormir. Cuidado real, deterioro de cultivos inmaduros y ciertas producciones conservan sus reglas separadas. Los cultivos maduros permanecen para decoración. No alterar estas decisiones al renovar la presentación.

## Publicación y comprobación de cada avance

Trabajar sobre el último estado de `claude/supermarket-mania-minigame-xn2it8`, integrar cambios, probar, documentar, hacer commit y push a esa rama al cerrar cada avance. Si llega otro commit remoto durante el trabajo, incorporarlo antes de publicar y probar de nuevo. Esta es la instrucción de Javier para este frente; no hace falta preparar ZIP por cada bloque.

Desde `juego/web`:

```sh
npm ci
npm run probar:granja
npm run build
npm run build:amigos
```

El runner ejecuta las suites de `scripts/granja-v3/probar-*.mjs` una por una y falla ante errores. Las pruebas visuales/de integración usan un contexto de navegador aislado, nunca una partida del jugador. Verificar casa → granja → casa → granja, controles, guardado y recursos desde el build. El workflow existente «APK Android» compila las versiones de pareja y amigos e instaladores al subir; confirmar sus resultados para el commit publicado.

Plan de aceptación completo: [`../../juego/web/src/granja-v3/PLAN-MOTOR-COMPLETO.md`](../../juego/web/src/granja-v3/PLAN-MOTOR-COMPLETO.md). Documentación funcional resumida: [`../sistemas/granja.md`](../sistemas/granja.md).
