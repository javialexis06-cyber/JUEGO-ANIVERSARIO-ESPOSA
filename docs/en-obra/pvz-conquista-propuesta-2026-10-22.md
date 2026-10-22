# La Semilla Madre · diseño de conquista territorial

22 de octubre de 2026. Javier pidió una base jugable para decidir después de probarla. Este documento distingue
la dirección del mundo final de la implementación actual, descrita en
[la entrega de Conquista](pvz-conquista-base-2026-10-22.md). Las cifras del prototipo son provisionales y no
modifican dificultad, precios, estadísticas ni recompensas del PvZ anterior.

## Decisiones vigentes

- Conquista es el modo principal. La aventura PvZ de cuarenta niveles y los doce patios clásicos se conservan
  como minijuegos con sus propios guardados. Fusión también tendrá un minijuego separado; sigue pendiente.
- La historia empieza **solo con nuestra casa**. Se purifican casas, calles, ciudades y países progresivamente,
  se dejan defensas y se sufren contraataques en las fronteras.
- La meta nueva es **100% del mapa**, sustituyendo el objetivo inicial de la mitad. El Dr. Zomboid y los zombis
  abandonan el planeta en una nave fabricada por él al perder su última fortaleza.
- Las fusiones se desbloquean en el tramo final de historia. En versus están disponibles desde el inicio.
- Cada zona conserva su equipo y formación. Cada expedición selecciona su grupo del catálogo disponible.
  El catálogo completo de PvZ 1, PvZ 2 y Fusión es un objetivo pendiente: no está terminado.
- Las batallas continúan al cambiar de frente. Debe aumentar la presión sin exigir atender todos los frentes
  manualmente a cada instante. El mundo no avanza al cerrar el juego.
- En PvP se puede expandir por varias rutas o concentrarse en una sola. Se gana al destruir el fuerte rival;
  no es necesario conquistar el 100% en este modo.
- Menús, selección, sala de espera y carga deben seguir la dirección ilustrada aprobada. Las escenas de espera
  muestran combates animados en distintos ambientes, con cámaras y efectos; no son una película prerenderizada.

## Escala final y base para jugar

| Elemento | Base implementada | Dirección del mundo futuro |
|---|---|---|
| Historia | 12 áreas en tres países y seis ciudades; empiezas en casa | 12 países × 4 ciudades × 5 áreas = 240 áreas |
| Objetivo | 12/12 controladas simultáneamente | 240/240, incluida la casa inicial |
| Fusión en historia | Laboratorio al controlar 8/12; desbloqueo permanente | Laboratorio en las últimas regiones |
| Fortaleza final | Accesible tras recuperar las otras 11 áreas | Última zona del mundo; huida espacial |
| Versus | 36 áreas, dos bases y 34 resistencias neutrales | Mapa simétrico ampliable después de probar esta base |
| Catálogo | 32 plantas, 21 zombis y cinco fusiones de muestra | Inventario verificable de PvZ 1, PvZ 2 y Fusión |
| Misiones | Asalto y defensa en tres carriles | Recuperación por tramos, escoltas, rescates y fortificaciones especiales |

Los países previstos son Verdalia, Marisma, Arenaria, Altarruta, Borealia, Solaria, Umbra, Forjaria, Neón,
Sauria, Coralia y Nubaria. Cada uno tendría cuatro ciudades de cinco áreas: residencial, vía principal,
zona especial, suministros y fortaleza. Son contenido futuro, no 240 escenarios ya construidos.
Los primeros renders y el mapa conceptual que mostraban media conquista quedaron como bocetos históricos.

## Una sesión de historia

Desde la casa se elige un área vecina conectada. Se prepara una expedición, se toma una cabecera y se avanza
plantando nuevas posiciones al despejar cada carril. Los zombis marchan y atacan las defensas. Ambos bandos
tienen oleadas automáticas; la intervención permite reforzar el punto importante y cambiar la situación.

Al capturar se genera una resistencia base adecuada al nivel. El jugador puede sustituirla por su equipo y
formación, fortificar o reparar. Cada área conserva su integridad. Las rutas conectadas con la base aportan
reservas; perder una conexión aísla el territorio y detiene sus ingresos y nuevas expediciones.

El director abre contraataques en las fronteras expuestas. Los marcadores de los mapas muestran los frentes abiertos. Para intervenir se vuelve al mapa de ciudad,
país o mundo, se elige la zona y se entra al combate sin reiniciar la batalla. No hay barra de frentes. La primera versión limita a seis
batallas activas; el enemigo pasa de uno a cuatro asaltos simultáneos según el territorio controlado.
La pausa global detiene todos los frentes. No hay derrota fuera de sesión ni un enemigo que avance al cerrar.

En la ofensiva final, un contraataque puede recuperar una zona mientras cae la fortaleza. Por eso la victoria
comprueba todas las áreas, y no solo la fortaleza: la película de huida aparece cuando se alcanza el 100% real.

## Decisiones de versus

Cada persona ocupa un extremo del mapa. Las zonas neutrales defienden con la guarnición del nivel: el rival
no puede controlar mágicamente esa resistencia. Después de capturar, el propietario decide su formación.

Expandirse aporta ingresos, rutas alternativas y apoyo. Una ruta única permite concentrar reservas hacia
el fuerte pero deja menos apoyo y puede cortarse. Los vecinos aliados adicionales aceleran las oleadas de
asalto hasta un 30%; los vecinos del defensor amortiguan el daño del núcleo hasta un 36%. Son reglas del
prototipo, separadas de la economía y las fichas de los minijuegos existentes.

El anfitrión simula todos los frentes; el invitado envía órdenes verificadas. Las instantáneas muestran el mismo
mundo con interpolación visual. Cualquiera puede pausar; cada persona retira su propia pausa. Un corte detiene
la partida hasta recuperar señal. Destruir ambos fuertes en el mismo paso produce empate. Salir cierra la sala
sin inventar una victoria. La base ofrece dos en un dispositivo, versus contra IA y salas por código.

## Próximas decisiones después de jugar

La presentación aprobada usa mapas ilustrados para mundo, país y ciudad, combate a pantalla completa y
controles redondos pequeños. Se eliminaron paneles superior, inferior y lateral y los carteles narrativos del final.

La base permite evaluar legibilidad, duración de batallas, necesidad de intervención, decisiones de ruta y
presión de las fronteras antes de producir cientos de áreas y el catálogo pendiente. Se mantienen pausados
los sprites restantes hasta que Javier decida el diseño después de probar. La granja permanece congelada.
