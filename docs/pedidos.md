# Pedidos de Javier · estado vigente

Actualizado el 16 de octubre de 2026. Esta lista sustituye las prioridades contradictorias del
[historial archivado](archivo/pedidos-hasta-2026-10-15.md).

## Encargo revisado

1. Limpiar referencias obsoletas y mantener documentación, instrucciones y repositorio coherentes.
2. Completar la comprobación de todos los juegos existentes, incluida la casa, sin desarrollar la granja.
3. Corregir los fallos funcionales encontrados y repetir los recorridos afectados.
4. Actualizar resultados y publicar los avances en `work` y `claude/supermarket-mania-minigame-xn2it8`.

La comprobación automatizada está terminada con los alcances registrados: campaña de 100 días de Súper,
100 puertas con narrativa, progresión de los cuatro mapas normales de Lavado, salas de los seis juegos de mesa,
Casa con dos perfiles y ampliación de Cocina, Sangre, Escudo, Torneo y Retrete. Se corrigieron los guardados de
Súper y Puertas y el resultado remoto del Torneo. Tipos, ambas compilaciones, filtro de amigos, motores,
48 suites de granja y seis comprobaciones de integración pasan. No se retoman expansiones descartadas.

Antes de cambiar dificultad, balance, costes, precios o recompensas, presentar una propuesta concreta y esperar
la aprobación de Javier. Las correcciones funcionales y las pruebas continúan sin pedir autorización de nuevo.
La cobertura se registra en [verificación general](en-obra/verificacion-general-2026-10-15.md) y
[auditoría de motores](en-obra/auditoria-motores.md). No confundir una prueba preparada con una campaña ordinaria
ni una comprobación de navegador con una prueba en teléfonos físicos.

## Pausado y descartado

- **Granja pausada:** no desarrollar ni modificar sus sistemas, historia, arte o balance. Las regresiones existentes
  y la comprobación de integración casa–granja pueden ejecutarse para detectar daños indirectos.
- **Descartadas las escenas premium no realizadas:** no construir la ampliación de escenarios propios ni la
  tienda prevista. Conservar las escenas programadas, sus IDs y las compras que ya existan.
- **Descartado el contenido futuro del sótano:** no crear la nueva zona, el juego de terror ni otros juegos
  propuestos para ella. Desaparecidos de Astra y el sótano del tablero de Clue ya existen y se conservan.
- No retomar propuestas antiguas, nuevos modos o expansiones por aparecer en documentos históricos.

## Avances terminados antes de este encargo

- **Show:** cierre y premio recuperables, protección de respuestas y pausa compartida; música sintetizada propia.
- **Desaparecidos:** ocho casos, 6.111 mensajes, 96 audios nuevos (152 en total), historiales, búsqueda y apuntes
  manuales sin pistas automáticas. Se conservan claves, soluciones y partidas anteriores.
- **Carreras:** 16 circuitos originales, cuatro copas, tres arenas y cuatro desafíos contra bots; las copas se
  comparten en salas. Los desafíos nuevos siguen siendo locales; añadir multijugador sería una ampliación.
- **Lavado:** corrección de enemigos reutilizados, ambos aretes en los cuatro mapas normales y movimiento remoto
  suavizado; [builds de referencia](en-obra/builds-lavado-minuto30.md) registradas.
- **Sangre:** límite aprobado de 1,5 s de aturdimiento y 1 s de resistencia; sigilos por porcentaje de vida.
  Berserk no se añadió; es una idea que requiere propuesta y aprobación, no una corrección pendiente autorizada.
- Existen recorridos y pruebas de mesa, Cocina, Escudo, Torneo, Retrete y Cien Puertas; la revisión
  general registra las ampliaciones realizadas y los límites que permanecen. Los resultados concretos están en la auditoría.

## Bloqueos externos y comprobaciones físicas

- Comprobado el 16 de octubre para `3b83c2d9`: GitHub devuelve `HTTP 422: Actions has been disabled for this user` al intentar generar la APK. Hace falta reactivar
  Actions en la cuenta; no anunciar instaladores anteriores como si incluyeran cambios nuevos.
- Los archivos siguen pidiendo aplicar/confirmar `supabase/cambios-pendientes.sql` en el servicio real. No se da
  por aplicado porque las pruebas locales de SQL pasen.
- FPS, batería, memoria, sensores y red entre teléfonos necesitan dispositivos físicos. Las simulaciones se
  identifican como tales y no certifican estos puntos.

El contenido descartado no debe reaparecer como tarea. Cuando termine la comprobación autorizada, informar
qué pasó, qué se corrigió y qué límites externos o físicos permanecen.
