# Astra · La vida que no cabe en una vasija

Biblia narrativa encargada por Javier el 11 de octubre de 2026. **Autoría nueva sobre el canon de [mitologia.md](../mitologia.md), no recuperación de la conversación perdida.** Los acontecimientos añadidos, apellidos institucionales y relaciones son ficción del juego. No describen recuerdos reales de la pareja.

Esta entrega contiene historia y especificaciones de producción; no activa por sí sola misiones, portales, voces ni recompensas en el motor. El usuario autorizó publicar todo el trabajo. La primera versión de armas está integrada en las expediciones actuales; la expansión narrativa y Confluencia siguen pendientes de implementación. Las 142 identidades del reparto original y sus cinco figuras narrativas se conservan; Fuatia se añade como sexta figura; Sangrevil y los protagonistas se documentan aparte porque no están en ese catálogo. Los nombres antes propuestos se adoptan en esta biblia, sin modificar todavía las etiquetas de la partida.

| Lectura | Contenido |
|---|---|
| [Mundo](01-mundo.md) | Reglas de Astra, cronología, geografía, facciones, religión y vida cotidiana. |
| [Campaña](02-campana.md) | Historia principal, escenas completas, decisiones y final. |
| [Reparto](03-reparto.md) | Biografías, cambios personales y misiones dialogadas de los 142 NPC. |
| [Relaciones y secretos](04-relaciones-secretos.md) | Vínculos, información privada, pistas y misiones ocultas. |
| [Jugabilidad](05-jugabilidad.md) | Recompensas, progresión, contratos de misión y correspondencia con el motor. |
| [Producción](06-produccion.md) | Dirección de voces, música, narración y escenas; orden de grabación. |
| [Encuentros](07-encuentros.md) | Diecinueve historias comunitarias de comida, juego, arte y descanso. |
| [Fuatia](08-fuatia.md) | Canon completo, relaciones, historia y neutralidad de la diosa. |
| [Misiones de Fuatia](08-misiones-fuatia.md) | Ocho arcos secundarios, incluido un nuevo secreto. |
| [Recursos y Confluencia](09-regiones-y-recursos.md) | 24 territorios de recursos, cultivos, fauna y motivos para regresar. |
| [Figuras y escenas](10-figuras-y-escenas.md) | Pasados extensos de figuras y protagonistas; cuatro escenas nuevas. |
| [Armas y combate](11-armas-y-combate.md) | Reglas RPG centradas en armas y estado del primer motor integrado. |
| [Datos](datos/) | Fuente estructurada de personajes, misiones, relaciones y líneas. |
| [Audio](audio/) | Guiones exportados por voz, catálogo de tomas y resumen de caracteres. |

El texto literario de mundo y campaña es la referencia de los acontecimientos. Los datos de reparto son la referencia para IDs, diálogos y recorridos personales. Los documentos generados se regeneran con `python docs/narrativa/herramientas/exportar.py`; la revisión cruzada se ejecuta con `python docs/narrativa/herramientas/verificar.py`. No se importa este contenido al runtime automáticamente.

Hay tres escalas de profundidad: la campaña y sus figuras sostienen el conflicto; cada habitante tiene un pasado, una contradicción y una misión que lo cambia; las relaciones y secretos cruzan esos arcos. Las conversaciones ambientales pueden repetirse, pero los cambios y premios de misión ocurren una sola vez. Ninguna amistad exige regalar diariamente para evitar una penalización.

La historia de la pareja conserva el Lazo Primordial. Una futura adaptación para amigos necesita el guion neutro y otra condición de protección; estos archivos no deben copiarse enteros al build de amigos. Los juegos casuales no se convierten en puertas obligatorias de la campaña.

La campaña ampliada conserva P01–P24 y añade F01–F12: 36 misiones principales. Los 142 arcos personales, doce secretos originales, 19 encuentros y ocho arcos elementales suman 217 misiones. Hay 284 conversaciones personales repetibles y 14 escenas cinematográficas. Consultar los catálogos para no confundir escenas, actos y misiones.

## Base de producción integrada

[Entrega a Claude y pendientes del motor](../../juego/web/src/granja-v3/ASTRA-INTEGRACION.md): 28 lugares, 142 identidades presentes, recursos y jugador de escenas integrados. Los 36 expedientes son adaptaciones de investigación; la campaña definitiva, los secundarios y sus premios no están completos.
