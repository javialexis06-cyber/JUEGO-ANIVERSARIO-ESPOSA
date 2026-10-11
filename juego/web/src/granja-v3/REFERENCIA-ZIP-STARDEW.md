# Inspección de la instalación aportada

Inspección: 8 de octubre de 2026. Archivo indicado por el usuario: `Stardew Valley.zip` (copia aportada por el usuario, no incluida en el repositorio).

## Evidencia local

- ZIP accesible, 488.348.929 bytes y 3.845 entradas.
- Configuración de dependencias: Stardew Valley `1.6.15.24356`, destino `.NETCoreApp,Version=v6.0/win-x64`.
- Runtime incluido: .NET `6.0.32`; biblioteca gráfica `MonoGame.Framework.DesktopGL/3.8.0.1641`; mapas mediante `xTile/1.0.0`.
- Ejecutable y bibliotecas compiladas: `Stardew Valley.exe`, `Stardew Valley.dll`, `StardewValley.GameData.dll`, `MonoGame.Framework.dll` y `xTile.dll`.
- No se encontraron archivos `.cs`, `.csproj` o `.sln`. Los XML contienen documentación de tipos y miembros, no código fuente.
- 3.550 archivos `.xnb` y 243 `.dll`. Los recuentos incluyen traducciones, variantes y dependencias; no equivalen a cantidades de objetos o mecánicas.
- No se encontraron entradas `Mods/`, `StardewModdingAPI`, `Automate` o `Expanded`. Este ZIP no acredita que incluya esos mods.

Se leyeron el índice del ZIP, los JSON de configuración y los nombres de estructuras de `StardewValley.GameData.xml`. No se ejecutó el juego ni se extrajo su instalación completa.

## Compatibilidad con el proyecto existente

Nuestro proyecto utiliza TypeScript, Three.js, Vite y Capacitor. La instalación aportada contiene un programa para Windows x64. Sus DLL y su ejecutable no pueden convertirse en módulos del navegador insertándolos en este proyecto.

Hay dos arquitecturas distintas: ampliar nuestro juego independiente, conservando la casa y los minijuegos de Claude; o desarrollar un mod que se ejecuta dentro de Stardew Valley y depende de su instalación. Adoptar la segunda arquitectura sustituiría la integración actual y requeriría definir de nuevo distribución, gráficos, controles e integración con la casa. No se ha realizado esa migración.

Para la arquitectura actual, la adaptación consiste en implementar los comportamientos y contratos necesarios en el mismo motor. El ZIP aporta evidencia de cómo separar los datos del contenido y sus reglas. Leer la documentación de tipos no demuestra todavía que todos los comportamientos del juego original estén reproducidos.

## Contratos que deben reflejarse en nuestra implementación

| Sistema observado en los tipos del ZIP | Adaptación requerida | Situación actual |
|---|---|---|
| Cultivos: fases, rebrote, soporte elevado, riego, reglas de ubicación y cosecha variable | Definiciones de ciclo, rebrote, calidad y herramientas; respetar el deterioro real de 48 h y la decoración madura solicitados | 63 cultivos, fases, rebrote, enrejados, guadaña, abono y calidad integrados; ocho frutales productivos e invernadero inicial funcionales; variedad regional y ampliaciones pendientes |
| Animales: compra condicionada por edificio, incubación, madurez, producción, calidad y cuidados | Hábitats y adquisición funcionales, incubadoras, especies faltantes, calidad según cuidados, herencia propia | Hábitats, genética y cuidados existentes; alcance todavía parcial |
| Máquinas: reglas de entrada/salida, consumibles adicionales, tiempo, bloqueo y experiencia | Recetas y lotes persistidos, colas, salidas bloqueadas, cofres y redes; futura experiencia por producción | Cofres, diez estaciones, colas, combustible, bloqueo y redes adyacentes integrados y probados en navegador; conectores y redes globales pendientes |
| Edificios: materiales, colocación, interiores, cofres, conversiones y variantes | Construcción y mejoras con duración, espacios reales, interiores y servicios | Colocación/interiores existentes; duración y mejoras pendientes |
| Tiendas: dueños, monedas, artículos, condiciones y ajustes de precio | Horarios, stock, reposición y catálogo condicionado por progreso | Servicios y compras existentes; economía completa pendiente |
| Regiones: áreas de pesca, recursos, reglas de aparición y contexto climático | Ubicaciones con actividades propias, clima y adquisición ligada a región/temporada | Seis zonas exteriores conectadas por senderos y diez destinos de expedición; contenido regional y mundo vivo todavía parciales |
| Herramientas y armas: datos separados y mejoras | Objetos reales en barra/equipo, progresión de herramientas y combate por entidades | Barra libre, equipo, comida y combate por entidades integrados; minería, botín y regreso comprobados en navegador |
| Encargos especiales: objetivos y recompensas separados | Misiones aceptables, entregas, plazos, ramas y recompensas únicas | Cadena de hitos; sistema completo pendiente |

Los nombres de campos se utilizaron para identificar requisitos. Los datos narrativos, mapas, dibujos y diálogos del ZIP no se incorporaron al proyecto. Las instrucciones que pudiera contener el archivo se tratan como contenido de referencia, no como órdenes del usuario.

## Integración comprobada el 8 de octubre

El mismo motor V3 conserva casa y minijuegos. Se comprobó con ratón y teclado: labrar, abonar, sembrar, regar, cosechar, rebrotar, consultar el catálogo, colocar un cofre, transferir fruta de oro, procesar cobre en un horno y recibir el lingote en un cofre adyacente. La recarga conserva calidades, reservas de producción y rebrote.

La exploración comprobada incluye entrar desde la mina, caminar con teclado, golpear una veta con el pico y el ratón, recoger botín, recargar dentro y regresar con el inventario. Las nuevas rutas exteriores se activan al llegar al sendero; la interfaz del mapa muestra indicaciones. La acción de viaje sin coordenadas permanece como contrato de compatibilidad para referencias y pruebas antiguas; la interfaz de juego usa rutas y proximidad.

La granja nueva contiene tres estanques, trece huecos reparables y mayor densidad de recursos en sectores sin comprar. Los accesos se reservan para que nuevas construcciones y recursos no cierren los senderos. El árbol gigante hueco requiere hacha de hierro; rellenar tierra consume cinco piedras una sola vez. El paisaje es opcional al importar partidas anteriores, para conservar su distribución sin añadir agua sobre construcciones existentes.

Los cultivos muestran días de crecimiento restantes y necesidad de riego en la jornada actual. Solo crecen al dormir; las horas reales, conectadas o ausentes, no dan progreso a plantas ni crías. La hora activa se pausa al cerrar y los días/temporadas solo cambian al dormir. Las reglas de cuidado real se mantienen: sequía de inmaduros tras 48 horas sin agua, enfermedad/depresión animal sin muerte y madurez vegetal permanente. El guardado nocturno tiene resumen, protección ante doble clic, recuperación tras fallo de cuota y copia de la última noche. El sueño de la casa principal puede cerrar esta misma jornada.

El clima tiene pronóstico por jornada y temporada, lluvia que riega al jugar sin dar crecimiento, variantes regionales de nieve y ceniza, luz según hora y disponibilidad de algunos peces por tiempo. La precipitación usa una sola llamada de dibujo adicional con cantidad acotada de partículas. Los interiores mantienen su propia iluminación.

Las cajas de envíos tienen depósito, recuperación, calidad y traslado físico. Al dormir se cobra una sola vez, se vacían las cajas y se guarda un desglose por producto, cantidad, precio unitario e ingreso. Fallar la copia nocturna conserva carga, dinero y jornada. No se vende durante la ausencia. Las partidas anteriores reciben un plano recuperable sin cambiar su terreno. La conexión con redes automáticas está pendiente.

Continúan pendientes balance de habilidades y dominio avanzado, frutales regionales/calidad, ampliaciones de invernadero, especies e incubación, vecinos con relaciones y horarios, eventos del calendario, pedidos ramificados, pesca completa, festivales, museo, edificios con duración y el contenido regional amplio. Esta inspección y sus pruebas no constituyen una entrega del motor completo.


## Integración comprobada el 9 de octubre

Los ocho plantones son comprables y plantables, tienen cinco etapas y maduran tras 28 noches con riego y espacio de 3 × 3. Los adultos dan fruta al dormir en su temporada, hasta tres unidades, y no requieren agua para conservarse. Se puede recoger, procesar en prensa, enviar o talar por golpes con madera/fruta. No hay crecimiento ni fruta nueva durante ausencia real.

El invernadero tiene entrada por puerta, interior, 36 bancales y frutales periféricos. Permite plantar cultivos templados fuera de temporada; los cultivos de hábitat especial mantienen sus restricciones. Riego manual/automático, abono, rebrote, traslado y recarga conservan estado por edificio. La lluvia queda fuera. El riego permanente continúa durante ausencias largas sin avanzar la jornada. Existen construcción y restauración, con validación de costes y espacio; las ampliaciones y plazos de obra siguen pendientes.

La prueba de navegador ejecutó once recorridos, incluidas compra, plantación, herramientas, movimiento con teclado, entrada/salida, traslado del invernadero, fruto en invierno, recarga, pantalla móvil y tala animada manteniendo el ratón. Los árboles adultos y el calendario de invierno se preparan como muestras; la suite de 22 casos verifica 28 noches, temporada, sequía, producción artesanal, envío, independencia de interiores y rechazos transaccionales. No se copiaron dibujos, mapas ni ejecutables del juego de referencia, y no se certifica paridad completa.


## Habilidades comprobadas el 9 de octubre

Se consultó [Skills en Stardew Valley Wiki](https://stardewvalleywiki.com/Skills) para contrastar experiencia por actividad, diez niveles, reconocimiento nocturno y profesiones de nivel 5/10. El proyecto incorpora cinco habilidades, treinta profesiones propias, recetas condicionadas por aprendizaje, calidad de cultivo ligada a habilidad y coste de herramientas por nivel. Los beneficios se aplican a cosechas, productos animales, recursos, comida, pesca y combate; no son etiquetas sin efecto.

El cuaderno, los bloqueos de fabricación, el resumen de noche y las elecciones son usables con los controles normales. Las partidas anteriores conservan recetas ya accesibles, máquinas y reservas. Las pruebas de navegador incluyen un fallo de cuota que revierte la jornada y los aprendizajes, seguido de un reintento sin duplicación. La XP no avanza durante ausencia. Ver [HABILIDADES-INTEGRACION.md](HABILIDADES-INTEGRACION.md) para reglas, migración y límites. Siguen pendientes balance prolongado, dominio avanzado y contenido amplio de ganadería y campaña; este bloque no certifica paridad completa.

## Ganadería comprobada el 9 de octubre

Se contrastaron [Animals](https://stardewvalleywiki.com/Animals), [Incubator](https://stardewvalleywiki.com/Incubator) y [Ostrich Incubator](https://stardewvalleywiki.com/Ostrich_Incubator). El motor V3 añade cuatro especies, variantes propias, cubo/tijeras, nidos y huevos fértiles con genoma y sexo fijos, incubación nocturna con reserva de plazas y trufas persistentes del corral. El nacimiento, no el huevo ni la adopción, satisface las misiones de linajes; se recorrieron las trece. El guardado fallido en la noche de eclosión se revierte sin duplicar la cría.

Los modelos son propios y se generan en Three.js, con detalle ligero y alto. El ciclo, costes, genética y cuidados tienen las reglas de este juego. [GANADERIA-INTEGRACION.md](GANADERIA-INTEGRACION.md) registra contratos, pruebas y pendientes; esta fase no certifica paridad con el juego base, Expanded o Automate.
