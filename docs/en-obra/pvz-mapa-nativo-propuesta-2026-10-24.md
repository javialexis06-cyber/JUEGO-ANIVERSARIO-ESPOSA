# Ampliación de las doce zonas con Gardendless

Pedido del 24 de octubre: extender la historia nativa al resto del mapa existente. Se mantienen las
estadísticas originales de Gardendless y las composiciones/cantidades de las doce zonas del prototipo.
Casa y estación conservan sus reglas actuales. La exclusividad de tipos, los puntos entre combates y los
mapas de ciudad/país/mundo se extienden a las doce zonas; los guardados anteriores se conservan.

## Diferencias de catálogo aprobadas

Gardendless 0.16.0 no tiene Saltador, Portero, Bailón ni Seta congelada con los comportamientos exactos
de PvZ 1. No se deben disimular esas diferencias conservando nombres de unidades que no se ejecutan.
Propuesta para las nuevas zonas, siempre con sus habilidades y valores nativos, sin editar el minijuego:

| Unidad del prototipo | Unidad nativa propuesta | Diferencia visible |
| --- | --- | --- |
| Saltador | Pirata espadachín (`swashbuckler`) | Entra con su cuerda nativa; no salta una planta con pértiga. |
| Portero | Cabezaladrillo (`tutorial_armor4`) | Lleva la protección nativa de ladrillo; no una puerta. |
| Bailón | Breakdancer (`eighties_breakdancer`) | Usa su habilidad de baile nativa; no invoca la formación de PvZ 1. |
| Seta congelada | Flor de hielo (`icebloom`) | Usa su congelación nativa y sus costes/recargas; no se presenta como la seta de PvZ 1. |

Las demás plantas de los doce escenarios tienen una correspondencia nativa. La nueva interfaz debe
mostrar las identidades nativas reales. Javier aprobó expresamente estas cuatro sustituciones en el chat: «Sí, usar esas unidades nativas».
La ampliación se describe en [implementación y límites](pvz-mapa-nativo-2026-10-24.md).

## Presión territorial

Se reutilizan las reglas existentes de la historia V2: ataques únicamente en zonas propias colindantes
con zombis, suministro conectado con la casa, máximo seis combates y tres expediciones, y presión de
una/dos/tres/cuatro defensas al poseer una/tres/cinco/ocho zonas. El intervalo existente es
`max(22, 42 - presión * 4)` segundos, con 35 segundos después del prólogo. No se añaden multiplicadores
de daño, vida ni recursos. La fortaleza se abre al recuperar las otras once zonas.

Los escenarios conservan sus tres a siete carriles: no se aceptan cinco carriles simulados donde el
escenario pide seis o siete. Noche y agua deben usar las reglas y recursos nativos correspondientes.
