# Verificación general de los juegos · 15–16 de octubre de 2026

> **Cierre de alcance · 16 de octubre:** Javier descartó los pendientes de generación de instaladores/Actions,
> SQL y Supabase real, dispositivos físicos, pruebas de recorridos parciales y ampliaciones de cobertura/desbloqueos
> enumerados después de esta revisión. Las limitaciones y los bloqueos descritos abajo conservan la evidencia
> histórica; no son una cola de tareas ni deben retomarse sin un nuevo pedido. Detalle en
> [pedidos vigentes](../pedidos.md).


## Encargo y alcance

Javier pidió limpiar las notas antiguas, actualizar el repositorio, comprobar los juegos existentes y corregir
los fallos funcionales. La granja sigue pausada: solo se ejecutaron sus regresiones e integración existentes.
Se descartaron las ampliaciones no realizadas de escenas premium y el contenido futuro del sótano. Se conservan
las 50 escenas programadas, sus IDs, las compras anteriores, el sótano de Clue y los ocho teléfonos de Astra.

Esta tanda no cambia dificultad, balance, precios, costes ni recompensas. Las ampliaciones sugeridas antes no
son fallos de los modos existentes ni se retoman por aparecer en documentos históricos.

## Correcciones funcionales

- **Súper Manía:** una escritura rechazada podía perder silenciosamente el resultado o una compra. Ahora se
  conserva una copia pendiente, se muestra el fallo y se ofrece reintento. Avanzar, comprar, reiniciar o salir
  espera la confirmación. Progreso y sueldo se reintentan por separado; el resultado de un día no se acredita
  dos veces. Se mantienen claves, partidas, precios y sueldo originales. Seis grupos nuevos de regresión.
- **Cien Puertas:** el avance y las monedas también ignoraban fallos de almacenamiento. Ahora esperan la
  confirmación, con aviso y reintento, antes de cruzar o salir. También tolera que el navegador bloquee el acceso al almacenamiento. La escritura ya confirmada no se repite al
  recuperar la otra. Se mantienen las estrellas y las recompensas de 1 por puerta y 10 por capítulo. Cuatro grupos
  de regresión y recuperación comprobada desde la interfaz.
- **Torneo:** el anfitrión podía finalizar dentro del intervalo de envío y dejar al invitado esperando el resultado.
  La última foto evita ese límite y usa el transporte fiable. Se descartan fotos antiguas y se conserva la última
  recibida mientras carga el invitado. Cinco grupos de regresión y combate de sala completo con resultado para
  ambos, ganador coincidente y vuelta al vestíbulo.
- **Escenas:** el selector deja de anunciar una pestaña de tienda que no existe y cuya ampliación se descartó.
  Conserva las escenas disponibles en el aparato y la propiedad anterior.

## Recorridos y evidencia

| Juego o familia | Resultado y alcance de la comprobación |
|---|---|
| Casa | Cuidado, comida, baño, sueño, compras pagadas, decoración, regalos, nota, habitaciones, mimos, trofeos y recarga. Se usó el sueldo realmente ganado en la campaña de Súper; la energía se preparó a 30 para probar el sueño. Dos perfiles con servidor Supabase simulado: compras simultáneas, mismo saldo/inventario, eventos pendientes entregados una vez, notas simultáneas, texto HTML inerte y álbum compartido. |
| Súper Manía | 100 días desbloqueados ganando desde progreso nuevo, 80 compras pagadas por interfaz y recargas de campaña. Escritura rechazada y recuperación sin repetir sueldo. Piloto legal de tareas y reloj acelerado, sin conceder recursos. Sala de tres: estado compartido, pérdida/reconexión y retorno; su cierre usa el escenario preparado del script, no equivale a ganar un día cooperativo completo. |
| Cien Puertas | Las 100 puertas con narrativa, recuerdos, álbum desbloqueado, estrellas conservadas, recarga y retorno. Respuestas conocidas, sensores simulados y reloj ×3; las reanudaciones importan únicamente copias producidas por el recorrido. Sala: inventario, candados, pausa, segundo plano, pérdida/reconexión y retorno compartidos en puertas seleccionadas; no son 100 puertas en red. |
| Dados Party, Mancala, Cajas, Parchís, Parchís a dos colores y Clue | Se mantienen seis recorridos locales y 36 partidas de reglas/IA. Completadas las seis partidas de sala con finales coincidentes y retorno; transporte simulado con 6 % de pérdidas y 160 ms. Parchís incluye pausa y reconexión. El piloto usa movimientos legales y acepta los diálogos de cartas de Clue; no se añadió una auditoría de aislamiento de cada mano privada. |
| Show de Nosotros | Se conserva el cierre recién publicado: tres episodios locales y uno completo en línea de 120 preguntas, premio único, libro, día y dos fallos de escritura recuperados; pausa compartida y capturas del estudio inspeccionadas. Sin cambios de código en esta tanda. |
| Lavado | Una progresión acumulada nueva desbloquea y gana Cara, Lavamanos, Bañera y Ducha en 18 partidas, con 48 compras por 77.124 gotas ganadas y normalización del progreso entre partidas. Simulación del motor con acciones legales; no es una campaña táctil de navegador. Se mantienen los recorridos previos de evolución/Muerte en los cuatro mapas con tienda/secretos preparados y las pruebas de movimiento remoto. Las 48 partidas exploratorias independientes de esta tanda no se cuentan como campaña acumulada. |
| Sangre y Ceniza | Otras 21 expediciones: las doce clases en Catacumbas/peligro 2 y Caballero, Alquimista y Bruja en Minas, Abadía y Castillo/peligro 3. Catorce victorias de cinco etapas y siete derrotas normales; selección de clase/arsenal preparada, sin conceder recursos de expedición y con compras pagadas. Se conserva la cobertura previa de Infinito y del control aprobado de 1,5 s + 1 s. No demuestra desbloquear todas las clases desde cero ni todas las combinaciones. |
| Cocina: Wafles, Fresas y Frappés | Se mantienen dos días locales desde cero y mejora pagada por receta. Fresas y Frappés añaden día 1 completo en pareja con pedidos/ingredientes normales, medias 94/97, mismo resultado, recarga y retorno. Pausa, segundo plano y reconexión con 8 % de pérdidas y 200 ms simulados. Premio de seis monedas solo al anfitrión. Se conserva Wafles en pareja, cuyo escenario anterior era preparado. |
| Retrete espacial | Se mantienen vuelos de amigos con escudo pagado, rechazo de escritura recuperado y retorno; vuelos de casa con Atrás nativo simulado y respuesta de pago perdida sin duplicación. Además, dos casas nuevas compran/comen empanada o leche por sus precios normales y descubren el vuelo desde el baño: 1.222 y 556 metros, retorno, trofeo ganado y recarga sin repetir premio; sin preparar acceso ni dinero. |
| Escudo de las Hermanas | Repetidos los seis niveles de amigos desde cero: tres estrellas y 20 vidas en cada uno, presupuesto normal, pausa y siete recargas. Infinito hasta derrota natural tras completar 48 oleadas. Derrota, reintento, cancelación y salida conservan mejores estrellas y vuelven a la sala. Se mantienen pareja y P23; el acceso de P23 estaba preparado, no procede de completar la campaña de granja. |
| Carreras | Cobertura vigente: 16 pistas originales, cuatro copas, tres arenas y cuatro desafíos, 96 carreras y 38 desafíos completos del motor. Tres copas nuevas y ocho desafíos por interfaz; copa de cuatro carreras en dos pestañas con ocho inscritos y podio coincidente. Los desafíos nuevos son locales contra bots; no se añade sincronización de esos modos. |
| Desaparecidos de Astra | Cobertura vigente: ocho casos desde cero, 24 estrellas, 6.111 mensajes, 152 audios decodificados, apuntes manuales, búsqueda, archivo y guardado recuperable. Las pruebas conocen las soluciones; la deducción sin ayuda necesita jugadores humanos. |
| Torneo | Se conserva el arcade de seis rivales con Tarek y 18 combates con réplica. Añadidos 400 cruces entre los diez luchadores y cuatro dificultades. Dos mandos en el aparato con teclado automatizado completan Plaza, Brasaviva y Nieveclara, pausa y resultado. Sala local completa con ambos resultados tras la corrección; no acredita internet real. El arcade actual termina en una sesión, sin guardado de etapa. |
| Granja | Sin cambios de sistemas, contenido, arte o balance. Pasan las 48 suites existentes y las seis comprobaciones de integración casa–granja, inventario, correo, posición, jornada y recarga. Su campaña y capacidades planificadas permanecen pausadas. |

Se reutilizó la cobertura reciente cuando el código no cambió. El detalle histórico y las builds de referencia
siguen en [auditoría de motores](auditoria-motores.md) y [Lavado al minuto 30](builds-lavado-minuto30.md).

## Validación final

- `npm run build` y `npm run build:amigos`: tipos y compilaciones correctos. El filtro de amigos revisó 578
  archivos, 45 palabras y 190 frases sin encontrar contenido de pareja.
- `npm run probar:motores`: pasa, incluyendo los nuevos guardados y la regresión de red del Torneo.
- `npm run probar:granja`: 48 suites, cero fallos.
- Integración sobre el build completo con `scripts/granja-v3/verificar-demo.mjs`: seis comprobaciones,
  `errors: []`, `bad: []`.
- Casa, Súper y Puertas en sala, Escudo en amigos y descubrimiento de Retrete con ambos personajes: recorridos finales terminados sin errores de página.

Los scripts reproducibles se conservan en el repositorio. Los registros locales están bajo
`juego/web/test-results/verificacion-general-2026-10-15/`, con logs finales en `logs/`; capturas y volcados no se
publican como código. Las pruebas usan contextos aislados, nunca la cuenta ni los guardados de Javier.

## Límites registrados · tareas adicionales descartadas

- No se certifican teléfonos físicos, FPS, batería, memoria, precisión táctil, sensores ni internet entre aparatos.
  Algunas pruebas de flujo desactivan el dibujo WebGL para evitar el coste del renderizado por software; sus
  resultados acreditan datos/interfaz, no presentación gráfica.
- Los pilotos, relojes acelerados y sensores simulados se indican en cada recorrido. Una selección de clase o
  acceso preparado no demuestra su adquisición ordinaria. No se probaron todas las combinaciones ni todos los
  modos infinitos; las derrotas de pilotos no justifican por sí solas tocar el balance.
- Si el aparato rechaza toda escritura y se cierra por la fuerza, la copia pendiente en memoria no está protegida.
  Los avisos piden mantener abierto y reintentar; no se promete recuperar datos que nunca pudieron escribirse.
- Las salas locales o con Supabase simulado no certifican el despliegue de `supabase/cambios-pendientes.sql` ni el
  servicio real. Su aplicación debe confirmarse en Supabase.
- Comprobado de nuevo el 16 de octubre tras publicar `3b83c2d9cd91fa0bada12b09f002538856b4aefb`
  en ambas ramas: no hay ejecución de `apk.yml` para ese SHA. El intento manual devolvió **HTTP 422: Actions
  has been disabled for this user**. El bloqueo corresponde a la cuenta; reactivar Actions y repetir el workflow
  es necesario para generar los instaladores. No hay APK nueva de esta tanda; una ejecución histórica verde no
  incorpora estas correcciones.

La revisión automatizada cubre todos los juegos existentes fuera del desarrollo pausado de granja. Los límites
anteriores se conservan como alcance de la evidencia; sus tareas adicionales fueron descartadas. No se afirma perfección ni balance universal.

## Publicación

Limpieza inicial publicada en `df687ed3`. Correcciones, pruebas y cierre de cobertura publicados en `3b83c2d9`,
confirmado en `work` y `claude/supermarket-mania-minigame-xn2it8`, sin push forzado. El seguimiento de APK se
actualiza en documentación, sin cambios adicionales al código probado.

## Repetir los recorridos añadidos

Desde `juego/web/`, servir `dist` completo en 4182 y `dist-amigos` en 4184 después de compilar. Las pruebas
que importan módulos fuente usan Vite sin HMR en 5176. Usar contextos aislados y ejecutar los recorridos de
navegador de uno en uno; los parámetros reducen dibujo o aceleran el reloj y no simulan teléfonos reales.

```sh
CHROME_PATH=/usr/bin/chromium node scripts/probar-super-campana.mjs http://127.0.0.1:5176/ test-results/repetir-super
CHROME_PATH=/usr/bin/chromium node scripts/probar-puertas-campana.mjs http://127.0.0.1:5176/ test-results/repetir-puertas
node scripts/probar-lavado-progresion.mjs
CHROME_PATH=/usr/bin/chromium SOLO_SALA=1 node scripts/probar-peleas-multijugador.mjs http://127.0.0.1:5176/ test-results/repetir-torneo
CHROME_PATH=/usr/bin/chromium SIN_DIBUJO=1 node scripts/probar-linea.mjs http://127.0.0.1:4182/index.html test-results/repetir-casa-linea
CHROME_PATH=/usr/bin/chromium node scripts/probar-retrete-descubrimiento.mjs http://127.0.0.1:4182/ test-results/repetir-descubrimiento
# Repetir para fresas y frappes; importa código fuente desde el servidor sin HMR:
CHROME_PATH=/usr/bin/chromium COMPLETO=1 node scripts/probar-cocina-linea.mjs fresas http://127.0.0.1:5176/scripts/cocina-prueba.html test-results/repetir-cocina
```
