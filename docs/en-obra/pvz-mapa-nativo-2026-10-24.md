# Historia nativa · las doce zonas del mapa

Pedido del 24 de octubre de 2026: «extiende al resto del mapa». Sustituye la pausa anterior de ampliación
para las **doce áreas existentes**, no convierte el boceto de 240 áreas en contenido terminado.
Continúa el [sector inicial](pvz-historia-nativa.md) y la [precarga/siembra](pvz-precarga-controles-gardendless-2026-10-23.md).

## Cómo jugar

Entrar al Jardín → Historia (`jardin.html?modo=historia`). Defender primero La casa. Después, seleccionar
un territorio vecino conectado con la casa desde los mapas de ciudad, país y mundo. Explorarlo descubre sus
semillas; preparar su baraja y comenzar la expedición. Los controles de mapa regresan a la ciudad del frente
que estabas viendo. Las espadas permiten saltar a cualquier batalla activa.

No basta con ver un lugar en el mapa para poder atacarlo: debe existir una ruta de zonas propias desde
La casa hasta uno de sus vecinos. La fortaleza requiere recuperar las otras once zonas. Una pérdida puede
cortar esa ruta; las defensas aisladas siguen existiendo y pueden recibir ataques, pero no enviar semillas
hasta recuperar su conexión. Perder La casa termina la historia.

| Área | Carriles activos | Semillas descubiertas |
| --- | --- | --- |
| La casa | 5 | Lanzaguisantes, Girasol, Nuez, Petacereza |
| Estación vieja | 4 | Repetidora, Patatapum |
| Casas del roble | 5 | Hielaguisantes, planta carnívora |
| Calle del molino | 3 | Hipnoseta, Flor de hielo |
| Parque del estanque | 5 | Cactus, Trebolador, Planterna |
| Paseo del farol | 3, noche | Seta desesporada, Seta solar, Humoseta, Comepiedras |
| Puente del río | 4, dos de agua | Nenúfar, Marseta, Zampalga |
| Almacén de semillas | 7 | Tripitidora, Aplastaflor, Nuez alta |
| Avenida del mercado | 4 | Bipetidora, Frustrella, Calabaza |
| Plaza de las fuentes | 6 | Plantorcha, Pinchohierba, Jalapeño |
| Colina del norte | 6, noche | Magnetoseta, Seta miedica, Petaseta |
| Fortaleza zombi | 7, noche | Utiliza semillas ya descubiertas |

Las cantidades y composiciones de oleadas proceden de los doce escenarios existentes. Casa y estación
conservan sus 150 soles iniciales; las otras diez zonas conservan los 50 de sus plantillas. Las unidades y sus
valores son los originales de Gardendless. Javier aprobó expresamente las cuatro diferencias de catálogo:
Pirata espadachín en lugar de Saltador; Cabezaladrillo en lugar de Portero; Breakdancer en lugar de Bailón;
Flor de hielo en lugar de Seta congelada. Ver [propuesta aprobada y diferencias](pvz-mapa-nativo-propuesta-2026-10-24.md).
No se hacen pasar esas habilidades por las de PvZ 1. El catálogo compartido fija 32 plantas del recorrido.

## Reservas, frentes y conservación

- Cada tipo completo pertenece a una sola zona. Las ocho ranuras de la baraja nativa limitan cada formación.
  Un traslado en descanso elimina sus ejemplares del terreno anterior sin devolver soles. Las reservas de
  cualquier origen o destino en combate no se pueden cambiar. Una derrota elimina su defensa, no libera
  silenciosamente sus tipos; se pueden recuperar o reasignar cuando haya una ruta válida.
- Al ganar se conservan casillas, vida restante, soles, recargas, lápidas restantes, cráteres y cortacéspedes. Los puntos admiten soporte
  acuático, planta y Calabaza en la misma celda. La restauración respeta ese orden y guarda los temporizadores
  compatibles de crecimiento, duración, producción, digestión y descanso; no son instantáneas de una batalla.
- Se reutiliza la presión de V2: una/dos/tres/cuatro defensas al poseer una/tres/cinco/ocho zonas. Los ataques
  solo afectan fronteras con territorios zombis y respetan el descanso de 18 segundos. El primer contraataque
  espera 35 segundos tras ganar el prólogo; los siguientes usan `max(22, 42 - presión × 4)` segundos.
  Hay hasta tres expediciones y seis combates simultáneos. No se añaden multiplicadores de daño o vida.
- Todos los combates activos reciben pasos nativos de 1/60 s. Cambiar de vista no los reinicia ni detiene al
  enemigo. La pausa es global, también desde el teclado nativo. Una preparación tardía no bloquea los otros
  frentes.
- Se preparan en paralelo las defensas de frontera y destinos próximos. El conjunto residente se limita a
  ocho motores para no mantener doce contextos gráficos pesados sin necesidad. Nunca se descarta un combate
  activo: los interiores en descanso pueden liberar su motor, conservando su punto exacto entre combates.
  Visitar un interior liberado requiere reconstruir su escena; los campos residentes preparados se reutilizan.
  El mapa y la formación siguen disponibles durante la preparación, sin superponer pantallas de carga.
  La primera descarga todavía depende de la conexión y la caché.

Los tableros de seis y siete filas tienen `Lane`, `LnC`, `LnCLower`, cortacéspedes y coordenadas propias por fila.
No se redirige una sexta fila a la quinta. El adaptador usa componentes/animaciones nativos y una cuadrícula
sobre su terreno; los escenarios estrechos cierran las franjas sobrantes visual y mecánicamente. El puente
acuático marca sus dos filas con el tipo nativo de agua. La noche emplea el escenario nocturno nativo y no
incluye el módulo de soles del cielo. Las lápidas iniciales respetan las columnas y cantidades de cada
plantilla; Comepiedras usa su comportamiento nativo para retirarlas, y no reaparecen tras guardar una victoria. La ambientación gráfica específica de cada edificio no queda terminada
por conectar estos tableros: el combate conserva los fondos y recursos nativos.

Al recuperar las doce zonas y terminar los ataques pendientes se activa la escena existente de huida en nave.
Volver al mapa muestra la conquista completa. No se conceden victorias por explorar ni por cerrar una ventana.

## Partidas anteriores

Se conserva la clave `conquista-historia-nativa-v3` y su equivalente de amigos; el documento interno nuevo
es **versión 4**. Leer un punto válido V3 añade diez territorios vacíos sin alterar las dos zonas existentes,
plantas, daño, soles, reservas ni ataques pendientes. Solo los nuevos lugares explorados conceden sus semillas.
Un archivo inválido o de una versión futura se conserva sin reemplazarlo. La copia se valida antes de escribir,
con comparación del almacenamiento y bloqueo de pestaña. Se conservan exportación/importación con confirmación.

El guardado sigue siendo **entre combates**. Al cerrar durante una batalla se explica que habrá que repetir
ese ataque desde su inicio usando el último punto terminado. No se restauran proyectiles, zombis ni eventos
intermedios. V2, aventura, minijuegos y sus claves no se migran ni se sobrescriben.

## Verificación y límites

- `npm run probar:pvz:historia-nativa`: ocho regresiones preparadas del inicio, reservas y archivos.
- `npm run probar:pvz:mapa-nativo`: nueve casos estratégicos preparados del mapa completo, suministro,
  presión, límites de frentes, exclusividad, capas y compatibilidad V3. Las victorias de esos casos son
  resultados preparados; no acreditan que un jugador haya ganado la campaña.
- `npm run probar:pvz:mapa-nativo-cocos`: abre los doce escenarios en Cocos real y comprueba geometría,
  filas de agua, noche, semillas y reinicio entre terrenos. Revisa además la persistencia por capas y
  siembra/impactos en la séptima fila mediante un combate preparado y pasos externos acelerados. Registra
  capturas y resultados en `juego/web/test-results/mapa-nativo-cocos/`.
- `node scripts/probar-mapa-nativo-interfaz.mjs`: recorre mundo/país/ciudad, barajas, conquista y recarga del
  final con transporte preparado. La interfaz/coordinador/guardado son reales; sus victorias son simuladas.

Los informes de navegador identifican errores y solicitudes fallidas. Las pruebas con casos preparados no
certifican ganar todas las zonas con recursos normales, todas las habilidades posibles ni fluidez en teléfonos.
La campaña definitiva, Fusión territorial, PvP nativo y la instantánea completa siguen pendientes. Se conserva
la presentación nativa; la migración a arte propio/ElevenLabs permanece pausada. La granja no se modifica.

### Registro del cierre

La comprobación nativa pasó **15 casos sin errores de página ni recursos fallidos**: los doce tableros,
persistencia acuática por capas, lápidas/cráteres y siembra/impactos en la séptima fila. El caso de combate
empleó un punto preparado con Tripitidora y Nuez alta; la siembra cobró los 125 soles nativos y el zombi
básico pasó de 190 a 0 de vida por los proyectiles del motor. No es una victoria de campaña con recursos normales.

La interfaz pasó **17 comprobaciones con transporte preparado**, incluido volver al mapa, conquistar las
doce áreas, recargar su final, importar una campaña terminada y comenzar otra en la ciudad de La casa.
El caso estratégico enumera las doce plantillas con cuatro semillas aleatorias (48 configuraciones), además
de presión, suministro, reservas y compatibilidad. La coordinación conserva una precarga al explorar y asignar
la formación prevista, permite avanzar otro frente durante un inicio retenido y respeta la pausa global.

Los controles sobre compilaciones completas pasaron **11 casos de pareja y 11 de amigos**: conservar 13 de
vida en la planta preparada, cambiar de vista, pausa nativa global, importación/exportación, bloqueo de otra
pestaña, fallo/reintento de escritura y repetición explícita de un ataque interrumpido. Las dos formas de
siembra pasaron **14 casos con ratón y táctil**. Tras fijar los scripts a `historia4`, el control táctil de amigos
repitió sus siete casos sin errores: así una caché anterior no mezcla adaptadores del sector V3 con el mapa V4.

Los minijuegos originales pasaron siete controles: siembra nativa en PvZ 2 y arranque/persistencia preparada
de Portable, cuyo combate conserva su limitación de recursos. Pasan la regresión general de motores y las
48 suites existentes de granja. Las compilaciones de pareja y amigos pasan; el filtro de amigos revisa 662
archivos contra 45 palabras y 190 frases. Los 54 archivos fijados de motores y adaptadores coinciden con sus
huellas. No se modificó la granja.

El build final pasó también sus seis controles de integración en un contexto aislado, sin otras pruebas de
navegador: acceso, movimiento, buzón, inventario, ida/vuelta entre casa y granja y recarga. En ese mismo build
se repitieron los 17 casos de interfaz y los tres de coordinación. Son verificaciones separadas de las partidas
nativas y de la prueba física de un dispositivo.
