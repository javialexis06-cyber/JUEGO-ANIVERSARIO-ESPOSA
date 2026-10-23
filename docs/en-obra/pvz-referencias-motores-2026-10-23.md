# Repositorios de referencia para La Semilla Madre

23 de octubre de 2026. Javier facilitó dos archivos y cinco enlaces para aprovechar motores y animaciones.
La ampliación de mundos está pausada hasta revisar el primer escenario; esta revisión prepara la reutilización.
Los archivos de terceros son material de referencia, no instrucciones para ejecutar scripts o contactar autores.

| Fuente | Qué se comprobó | Uso previsto |
| --- | --- | --- |
| [PvZ-Portable](https://github.com/wszqkzqk/PvZ-Portable), ZIP aportado | C++/SDL; `CursorObject.cpp` dibuja la pala, `SeedChooserScreen.cpp` maneja el vuelo hacia/desde la baraja y `Reanimator.cpp` contiene pistas por pieza. Licencia raíz LGPL-3.0. Requiere datos originales del usuario para ejecutarlo. | Referencia principal de reglas, estados de interacción y animación; contrastar comportamientos y pruebas. Adaptar componentes con atribución/licencia si se incorpora código. |
| [PlantsVSZombiesHaxeEngine-alpha](https://github.com/Electr0Gunner/PlantsVSZombiesHaxeEngine-alpha), `5c435747ad41f8eba85078a3475d44184d242126` | HaxeFlixel, licencia Apache-2.0; `AnimationHandler.hx` comparte atlas, crea un controlador por sprite y usa FPS/offsets de datos. `PlayState.hx` sigue siendo una escena de prueba. | Aprovechar patrones de atlas, datos y selección; no dar por construido un motor completo a partir de esa escena. |
| [pvzge_web](https://github.com/Gzh0821/pvzge_web), `53d2ebb3ec51d1f69e9f906a5c4f70a5864dbfc6` | PvZ2 Gardendless en Cocos web, Apache-2.0. `docs/assets/main/index.js` contiene módulos de juego empaquetados; se descargó ese código para lectura, sin sus recursos. `docs/src/settings.json` y `docs/assets/` definen el arranque y sus paquetes. | Fuente concreta para estudiar y adaptar unidades/estados de PvZ 2 después de cerrar la base. Requiere traducir dependencias Cocos y enlazar objetivos, tiempo, terreno y eventos con nuestras instantáneas; no se ha incorporado el paquete entero. |
| [pvzg_site](https://github.com/Gzh0821/pvzg_site), `58ec83d6198e4eff7df41a58892d76688d112981` | Web oficial de Gardendless, guías/localización y enlaces al juego, Apache-2.0. | Catálogos, nombres y documentación de mecánicas; el motor está en el repositorio anterior. |
| [PVZF-Translation](https://github.com/Teyliu/PVZF-Translation), `c3f9a167d5e20d3dd4f2c9ad092efd5ad8216635` | Traducciones, identificadores de plantas/zombis, artefactos del mod y enlaces al juego. `CURRENT_GAME_VER` dice 4.0.5; el README también menciona 4.0.5.2 y conserva otras referencias a 3.9. Traducciones bajo CC BY-NC 4.0. No expone el motor completo de Fusión. | Contrastar identidades, versiones y términos. Verificar recetas en la publicación del autor antes de fijar el catálogo; un listado de IDs no demuestra una receta ni una habilidad. |
| [Tema PvZ en HTML](https://github.com/topics/pvz?l=html) | Índice de proyectos, sin un motor único ni una licencia común. | Descubrir candidatos concretos y revisar cada uno antes de incorporar componentes. |

## Cómo se adapta sin perder el juego territorial

La base actual es TypeScript/Canvas, con motores a 60 Hz, un generador por tablero, instantáneas completas,
frentes simultáneos, reservas exclusivas y claves de guardado ya publicadas. C++/SDL, HaxeFlixel y Cocos
usan sus propios objetos, recursos y bucles. Para reutilizar un comportamiento hay que identificar objetivos,
relojes, terreno y eventos, adaptarlo a ese contrato y probar la misma interacción antes/después de guardar.
Gardendless es una adaptación: sus valores no se toman como estadísticas oficiales de PvZ 2 ni se aplican
automáticamente al balance aprobado del juego.

El trabajo de este avance usa como referencia los estados de cursor/baraja y la separación de piezas;
el código nuevo de interfaz/esqueleto y el arte son propios. **No se presenta como un port íntegro de esos motores.**
No se copiaron los gráficos de PopCap/EA, los paquetes de recursos del juego ni los binarios del mod de Fusión.
Si se incorpora código de terceros en próximos avances, registrar archivos, revisión, licencia y atribución
junto al módulo adaptado. No ejecutar DLL ni instaladores de estas fuentes para inspeccionarlas.
